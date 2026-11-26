import { TextField } from '../app/ModeVisibility';
import { useContext, useEffect } from 'react';
import { Alert, Box, Button, Chip, MenuItem, Paper, Stack, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, Typography } from '@mui/material';
import { baseCerts, baseDomains, baseIPs, domainSet, machines, networkProducts as products } from './fixtures';
import { covers, operationDate, operationId, recordOperation, retryOperation, validDomain, validIP, type ChangeRow, type Operation } from './model';
import { applyNetworkOutcome, type NetworkConfiguration, type NetworkPayload } from './network-model';
import { Acknowledgement, CertificateFiles, ChangesTable, Checks, DemoControls, FeatureVisible, fileError, HistoryTable, OperationView, PageHeading, RunningNotice, useOperationClock, useStoredState, Wizard, type Files } from './shared';

type TabName = 'ip' | 'fqdn' | 'history';
type State = NetworkConfiguration & {
  version: number; view: 'current' | 'wizard' | 'operation'; tab: TabName; kind: 'ip' | 'fqdn'; step: number;
  scenario: string; editIds: string[]; draftIPs: Record<string, string>; product: string; draftDomain: string;
  files: Files; certDemo: boolean; certSAN: string[]; checked: boolean; checking: boolean; ack: boolean; error: string;
  operation: Operation<NetworkPayload> | null; history: Operation<NetworkPayload>[];
};
const demoFiles = { crt: 'new-domains.crt', key: 'new-domains.key', chain: 'ca-chain.crt' };
function seed(): State {
  return { version: 1, view: 'current', tab: 'ip', kind: 'ip', step: 0, scenario: 'success', ips: { ...baseIPs }, domains: { ...baseDomains }, certs: structuredClone(baseCerts), editIds: [], draftIPs: { ...baseIPs }, product: 'meet', draftDomain: baseDomains.meet, files: {}, certDemo: false, certSAN: [], checked: false, checking: false, ack: false, error: '', operation: null,
    history: [{ id: 'NET-0038', date: '18.09.2026, 14:20', started: 0, status: 'success', scenario: 'success', nodes: ['boards-01', 'web-01'], results: { 'boards-01': 'success', 'web-01': 'success' }, attempt: 1, mode: 'apply', summary: 'Изменение IP · Доски', rows: [{ node: 'boards-01', label: 'boards-01', before: '10.20.0.30', after: '10.20.0.31' }], payload: { kind: 'ip', product: 'boards', direct: ['boards-01'], targetDomain: '', replaceCert: false, certSAN: [] } }] };
}
function restore(value: State): State {
  if (!Array.isArray(value.history) || !Array.isArray(value.editIds) || !value.editIds.every(id => machines.some(node => node.id === id)) || !machines.every(node => typeof value.ips?.[node.id] === 'string') || !products.every(product => typeof value.domains?.[product.id] === 'string' && Array.isArray(value.certs?.[product.id])) || !products.some(product => product.id === value.product)) throw new Error('Invalid network state');
  const chosen = products.find(product => product.id === value.product)!;
  const reselect = value.view === 'wizard' && value.kind === 'fqdn' && !value.certDemo && domainSet(chosen, value.draftDomain.trim().toLowerCase()).some(domain => !covers(value.certs[value.product], domain.value));
  return { ...seed(), ...value, files: value.certDemo ? { ...demoFiles } : {}, certSAN: value.certDemo ? value.certSAN : [], checking: false, checked: reselect ? false : value.checked, step: reselect ? 0 : value.step, ack: false, error: '' };
}

export default function Network({ notify, networkTab, onNetworkTabChange }: { notify: (message: string) => void; networkTab?: TabName; onNetworkTabChange?: (tab: TabName) => void }) {
  const visible = useContext(FeatureVisible);
  const [s, set] = useStoredState('mts-link-on-prem-network-v1', seed, restore, value => ({ ...value, files: value.certDemo ? demoFiles : {}, certSAN: value.certDemo ? value.certSAN : [], checking: false, ack: false }));
  const update = (patch: Partial<State>) => set(previous => ({ ...previous, ...patch }));
  useEffect(() => { if (visible && networkTab) set(previous => previous.tab === networkTab ? previous : { ...previous, tab: networkTab, view: 'current' }); }, [networkTab, visible]);
  useEffect(() => {
    if (!s.checking) return;
    const timer = setTimeout(() => set(previous => ({ ...previous, checking: false, checked: true })), 700);
    return () => clearTimeout(timer);
  }, [s.checking]);
  const now = useOperationClock(s.operation, done => set(previous => {
    if (previous.operation?.id !== done.id || previous.operation.status !== 'running') return previous;
    return { ...previous, ...applyNetworkOutcome(previous, done), operation: done, history: recordOperation(previous.history, done, 5) };
  }));
  const product = products.find(item => item.id === s.product)!;
  const normalized = s.draftDomain.trim().toLowerCase();
  const future = domainSet(product, normalized);
  const domainChanged = normalized !== s.domains[s.product];
  const needsCert = domainChanged && future.some(domain => !covers(s.certs[s.product], domain.value));
  const certReady = !!s.files.crt && !!s.files.key && future.every(domain => covers(s.certSAN, domain.value));
  const proposed = { ...s.ips, ...Object.fromEntries(s.editIds.map(id => [id, (s.draftIPs[id] || '').trim()])) };
  const errors = Object.fromEntries(s.editIds.map(id => [id, !validIP(proposed[id]) ? 'Введите корректный IPv4-адрес.' : Object.entries(proposed).some(([other, ip]) => other !== id && ip === proposed[id]) ? 'Этот адрес назначен другой ВМ.' : '']));
  const otherDomains = products.filter(item => item.id !== s.product).flatMap(item => domainSet(item, s.domains[item.id]).map(domain => domain.value));
  const domainError = !validDomain(normalized) ? 'Введите FQDN без https://, порта и пути.' : future.some(domain => !validDomain(domain.value)) ? 'Служебный FQDN слишком длинный.' : future.some(domain => otherDomains.includes(domain.value)) ? 'Адрес пересекается с FQDN другого продукта.' : '';
  const ipRows: ChangeRow[] = s.editIds.filter(id => proposed[id] !== s.ips[id]).map(id => ({ node: id, label: id, before: s.ips[id], after: proposed[id] }));
  const fqdnRows = domainSet(product, s.domains[s.product]).map((domain, index) => ({ label: domain.label, before: domain.value, after: future[index].value }));
  const rows = s.kind === 'ip' ? ipRows : fqdnRows;
  const direct = s.kind === 'ip' ? ipRows.map(row => row.node!) : product.nodes;
  const dependencies = s.kind === 'ip' ? machines.filter(node => direct.includes(node.id)).flatMap(node => node.deps) : product.deps;
  const affected = machines.filter(node => [...direct, ...dependencies].includes(node.id));
  const localValid = s.kind === 'ip' ? ipRows.length > 0 && !Object.values(errors).some(Boolean) : domainChanged && !domainError && !s.error && (!needsCert || certReady);
  const blocked = s.scenario === 'blocked' || (s.kind === 'fqdn' && needsCert && s.scenario === 'cert');
  const unresolved = !!s.operation && s.operation.status !== 'success';
  const busy = s.operation?.status === 'running';
  const describe = (id: string) => { const node = machines.find(item => item.id === id); return node ? `${id} · ${node.product} · ${node.component}` : id; };
  function go(tab: TabName) { update({ view: 'current', tab }); onNetworkTabChange?.(tab); }
  function startIP(ids = machines.map(node => node.id)) { if (unresolved) return; update({ view: 'wizard', kind: 'ip', tab: 'ip', step: 0, editIds: ids, draftIPs: { ...s.ips }, checked: false, checking: false, ack: false, error: '' }); }
  function startFQDN(id: string) { if (unresolved) return; update({ view: 'wizard', kind: 'fqdn', tab: 'fqdn', step: 0, product: id, draftDomain: s.domains[id], files: {}, certDemo: false, certSAN: [], checked: false, checking: false, ack: false, error: '' }); }
  function fillExample() {
    if (s.kind === 'fqdn') { const base = product.id === 'meet' ? 'meet.company.ru' : product.id === 'platform' ? 'platform.company.ru' : 'boards.company.ru'; update({ draftDomain: s.domains[s.product] === base ? 'new-' + base : base, checked: false, certDemo: false, certSAN: [], files: {} }); return; }
    const draft = { ...s.draftIPs };
    s.editIds.slice(0, 2).forEach((id, index) => { let octet = 111 + index; let ip = '10.20.0.' + octet; while (Object.values(s.ips).includes(ip) || Object.entries(draft).some(([other, value]) => other !== id && value === ip)) ip = '10.20.0.' + (++octet); draft[id] = ip; });
    update({ draftIPs: draft, checked: false });
  }
  function upload(key: keyof Files, file: File) { const error = fileError(key, file); update(error ? { error } : { files: { ...s.files, [key]: file.name }, certDemo: false, certSAN: [], checked: false, error: '' }); }
  function launch() {
    if (!localValid || !s.checked || blocked || !s.ack || unresolved) return;
    const operation: Operation<NetworkPayload> = { id: operationId('NET'), date: operationDate(), started: Date.now(), status: 'running', scenario: s.scenario, nodes: affected.map(node => node.id), results: {}, failId: s.kind === 'ip' ? ipRows[0].node : product.nodes[1] || product.nodes[0], attempt: 1, mode: 'apply', summary: s.kind === 'ip' ? `Изменение IP · ${ipRows.length} ВМ` : `Смена FQDN${needsCert ? ' + сертификат' : ''} · ${product.name}`, rows: structuredClone(rows), payload: { kind: s.kind, product: s.product, direct, targetDomain: normalized, replaceCert: s.kind === 'fqdn' && needsCert, certSAN: s.kind === 'fqdn' && needsCert ? [...s.certSAN] : [] } };
    update({ operation, view: 'operation' });
  }
  const scope = <Paper variant="outlined" sx={{ p: 2 }}><Typography variant="subtitle1">Область воздействия · {affected.length} узлов</Typography>{affected.map(node => <Stack key={node.id} direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1} sx={{ mt: 1.5 }}><Typography variant="body2">{describe(node.id)}</Typography><Typography variant="body2" color="text.secondary">{direct.includes(node.id) ? s.kind === 'ip' ? 'Новый IP + настройки' : needsCert ? 'FQDN + сертификат' : 'Новый FQDN' : 'Обновление зависимых настроек'}</Typography></Stack>)}</Paper>;
  return <>
    {s.view === 'operation' && s.operation ? <>
      <OperationView operation={s.operation} now={now} describe={describe} onBack={() => go(s.operation!.payload.kind)} onHistory={() => go('history')} onRetry={mode => update({ operation: retryOperation(s.operation!, mode) })} />
      {s.operation.status === 'success' && s.operation.payload.kind === 'fqdn' && <Alert severity="info" sx={{ mt: 2 }}>Новый адрес продукта: https://{s.operation.payload.targetDomain}. Адрес показан для демонстрации; переход не выполняется.</Alert>}
    </> : s.view === 'wizard' ? <>
      <PageHeading title={s.kind === 'ip' ? 'Изменение внутренних IP' : 'Изменение FQDN'} subtitle={s.kind === 'ip' ? 'Адреса ВМ и зависимые настройки' : 'Основной адрес, служебные FQDN и сертификат'} />
      <Wizard labels={['Изменения', 'Проверка', 'Подтверждение', 'Результат']} step={s.step} checking={s.checking} onBack={() => update({ step: s.step - 1, ack: false })} onCancel={() => go(s.kind)}
        nextLabel={s.step === 0 ? 'Проверить изменения' : s.step === 1 ? 'К подтверждению' : s.kind === 'fqdn' && needsCert ? 'Применить FQDN и сертификат' : 'Применить изменения'}
        disabled={s.step === 0 ? !localValid : s.step === 1 ? s.checking || !s.checked || blocked : !s.ack || !s.checked || blocked || !localValid}
        next={() => s.step === 0 ? update({ step: 1, checking: true, checked: false }) : s.step === 1 ? update({ step: 2, ack: false }) : launch()}>
        {s.step === 0 && <Stack gap={2}><Stack direction="row" justifyContent="space-between" gap={2}><Typography variant="h6">{s.kind === 'ip' ? 'Укажите новые внутренние IP' : 'Измените основной FQDN'}</Typography><Button onClick={fillExample}>Заполнить пример</Button></Stack>
          {s.kind === 'ip' ? <>{s.editIds.map(id => <Stack key={id} direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} gap={2}><Box sx={{ flex: 1 }}><Typography>{describe(id)}</Typography><Typography color="text.secondary" variant="body2">Сейчас: {s.ips[id]}</Typography></Box><TextField label={'Новый IP · ' + id} value={s.draftIPs[id] || ''} error={!!errors[id]} helperText={errors[id] || ' '} onChange={event => update({ draftIPs: { ...s.draftIPs, [id]: event.target.value }, checked: false })} inputProps={{ inputMode: 'decimal', spellCheck: false }} /></Stack>)}<Typography>Изменено ВМ: {ipRows.length}</Typography>{ipRows.length > 0 && scope}</> : <>
            <TextField select label="Продукт" value={s.product} onChange={event => startFQDN(event.target.value)}>{products.map(item => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}</TextField>
            <TextField label="Новый основной FQDN" value={s.draftDomain} error={!!domainError} helperText={domainError || 'Без https://, порта и пути'} onChange={event => update({ draftDomain: event.target.value, checked: false, ack: false })} inputProps={{ spellCheck: false }} />
            <Typography color="text.secondary">Сейчас: {s.domains[s.product]}</Typography>
            {!domainError && domainChanged && <><ChangesTable rows={fqdnRows} /><Alert severity="info">Подготовьте DNS-записи для всех будущих FQDN. DNS управляется отдельно; здесь меняются настройки продуктов.</Alert><Alert severity={needsCert ? 'warning' : 'success'}>{needsCert ? 'Текущий сертификат не покрывает новые FQDN. Добавьте комплект для всех будущих адресов.' : 'Текущий сертификат покрывает весь будущий набор FQDN. Замена TLS не требуется.'}</Alert>
              {needsCert && <><CertificateFiles files={s.files} onFile={upload} /><Button onClick={() => update({ files: { ...demoFiles }, certDemo: true, certSAN: future.map(domain => domain.value), error: '', checked: false })}>Демо-комплект для новых FQDN</Button>{s.error && <Alert severity="error">{s.error}</Alert>}{certReady ? <Alert severity="info">Комплект выбран для всех будущих FQDN. Следующий шаг — проверка ключа, цепочки и срока.</Alert> : <Typography variant="body2" color="text.secondary">Для демонстрации проверки используйте демо-комплект. Содержимое загруженных файлов прототип не проверяет.</Typography>}</>}{scope}</>}
          </>}
        </Stack>}
        {s.step === 1 && <Checks checking={s.checking} items={[
          { title: 'Корректность адресов', text: 'Формат и отсутствие конфликтов подтверждены.', ok: true },
          { title: s.kind === 'ip' ? 'Доступность новых IP' : 'DNS-записи', text: s.scenario === 'blocked' ? s.kind === 'ip' ? 'Один из новых IP уже занят в сети. Выберите другой адрес.' : 'Новые FQDN не разрешаются в ожидаемые адреса. Проверьте DNS-записи.' : s.kind === 'ip' ? 'Новые адреса свободны; маршруты до узлов подготовлены.' : 'Все будущие FQDN разрешаются в ожидаемые адреса.', ok: s.scenario !== 'blocked' },
          ...(s.kind === 'fqdn' ? [{ title: 'Сертификат и ключ', text: needsCert ? s.scenario === 'cert' ? 'Закрытый ключ не соответствует сертификату. Загрузите согласованный комплект.' : 'Ключ, цепочка, срок и покрытие всех будущих FQDN проверены.' : 'Текущий сертификат покрывает все новые FQDN.', ok: !needsCert || s.scenario !== 'cert' }] : []),
          { title: 'Затронутые узлы', text: `${affected.length} узлов доступны. Зависимые настройки определены.`, ok: true },
          { title: 'Канал администрирования', text: 'Адрес admin.example.ru доступен и не меняется.', ok: true },
        ]} />}
        {s.step === 2 && <Stack gap={2}><Typography variant="h6">Подтвердите изменения</Typography><ChangesTable rows={rows} />{s.kind === 'fqdn' && needsCert && <Paper variant="outlined" sx={{ p: 2 }}><Typography variant="subtitle1">Также заменится сертификат</Typography><Typography variant="body2">До 13.10.2027 · новый комплект покрывает {future.length} FQDN.</Typography>{future.map(domain => <Typography key={domain.value} variant="body2" sx={{ overflowWrap: 'anywhere' }}>{domain.value}</Typography>)}</Paper>}{scope}<Alert severity="warning">Сервис обновит зависимые настройки и перезапустит затронутые компоненты. Активные встречи и пользовательские сессии могут прерваться.</Alert><Typography variant="body2">Адрес администрирования: https://admin.example.ru — не меняется.</Typography><Acknowledgement checked={s.ack} onChange={ack => update({ ack })}>Проверил изменения и понимаю возможное влияние на работу продуктов</Acknowledgement></Stack>}
      </Wizard>
    </> : <>
      <PageHeading title="Сетевые настройки" subtitle="Адреса узлов, домены продуктов и история изменений" />
      <RunningNotice operation={s.operation} onOpen={() => update({ view: 'operation' })} />
      {unresolved && <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Завершите текущую операцию или проверьте её результат перед новыми изменениями.</Typography>}
      <Tabs value={s.tab} onChange={(_, tab: TabName) => go(tab)} variant="scrollable" scrollButtons="auto" aria-label="Сетевые настройки" sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}><Tab value="ip" label="Внутренние IP" /><Tab value="fqdn" label="FQDN" /><Tab value="history" label="История изменений" /></Tabs>
      {s.tab === 'history' ? <HistoryTable history={s.history} operation={s.operation} now={now} describe={describe} onOpen={() => update({ view: 'operation' })} /> : s.tab === 'ip' ? <>
        <Stack direction="row" justifyContent="space-between" gap={2} sx={{ mb: 2 }}><Typography variant="h6">Адреса ВМ</Typography><Button variant="contained" disabled={unresolved} onClick={() => startIP()}>Изменить IP</Button></Stack>
        <TableContainer component={Paper} variant="outlined"><Table aria-label="Внутренние IP узлов" sx={{ minWidth: 580 }}><TableHead><TableRow><TableCell>ВМ / компонент</TableCell><TableCell>Продукт</TableCell><TableCell>Внутренний IP</TableCell><TableCell>Действия</TableCell></TableRow></TableHead><TableBody>{machines.map(node => <TableRow key={node.id}><TableCell>{node.id}<Typography variant="body2" color="text.secondary">{node.component}</Typography></TableCell><TableCell>{node.product}</TableCell><TableCell>{s.operation?.payload.kind === 'ip' && s.operation.status === 'unknown' && s.operation.results[node.id] === 'unknown' ? 'Не подтверждён · см. результат операции' : s.ips[node.id]}</TableCell><TableCell><Button disabled={unresolved} onClick={() => startIP([node.id])} aria-label={'Изменить IP ' + node.id}>Изменить</Button></TableCell></TableRow>)}</TableBody></Table></TableContainer>
        <Typography color="text.secondary" variant="body2" sx={{ mt: 2 }}>Сервис назначает новые адреса ВМ и обновляет связанные настройки. Область воздействия показывается до применения.</Typography>
      </> : <>
        <Typography variant="h6" sx={{ mb: 2 }}>Доменные имена продуктов</Typography><TableContainer component={Paper} variant="outlined"><Table aria-label="FQDN продуктов" sx={{ minWidth: 580 }}><TableHead><TableRow><TableCell>Продукт</TableCell><TableCell>Основной и служебные FQDN</TableCell><TableCell>TLS</TableCell><TableCell>Действия</TableCell></TableRow></TableHead><TableBody>{products.map(item => {
          const mixed = unresolved && s.operation?.payload.kind === 'fqdn' && s.operation.payload.product === item.id && s.operation.status !== 'running';
          return <TableRow key={item.id}><TableCell>{item.name}</TableCell><TableCell sx={{ overflowWrap: 'anywhere' }}>{mixed ? <><Chip label="Есть расхождения" color="warning" /><Typography variant="body2">Было: {s.domains[item.id]}</Typography><Typography variant="body2">Цель: {s.operation!.payload.targetDomain}</Typography></> : s.domains[item.id]}<Box component="details" sx={{ mt: 1 }}><Box component="summary" sx={{ cursor: 'pointer', color: 'primary.main' }}>Служебные адреса · {item.services.length}</Box>{item.services.length ? domainSet(item, s.domains[item.id]).slice(1).map(domain => <Typography variant="body2" key={domain.value}>{domain.value}</Typography>) : <Typography variant="body2">Отдельные служебные FQDN не используются.</Typography>}</Box></TableCell><TableCell><Chip label={mixed ? 'Проверить' : 'Покрыты'} color={mixed ? 'warning' : 'success'} /></TableCell><TableCell><Button disabled={unresolved} onClick={() => startFQDN(item.id)} aria-label={'Изменить FQDN ' + item.name}>Изменить</Button></TableCell></TableRow>;
        })}</TableBody></Table></TableContainer><Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Если новые FQDN не покрыты текущим сертификатом, новый комплект загружается в той же операции.</Typography>
      </>}
    </>}
    <DemoControls scenario={s.scenario} scenarios={['success|Успешное применение', 'blocked|Ошибка проверки IP / DNS', ...(s.kind === 'fqdn' ? ['cert|Ошибка сертификата'] : []), 'partial|Частичное применение', 'lost|Потеря связи после запуска'].map(value => value.split('|') as [string, string])} disabled={busy || s.checking} onChange={scenario => update({ scenario, step: 0, checked: false, ack: false })} onReset={() => { set(seed()); onNetworkTabChange?.('ip'); notify('Демоданные сетевых настроек восстановлены'); }} />
  </>;
}
