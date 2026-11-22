export type Employee = { id: string; name: string; email: string; role: 'owner' | 'admin' | 'employee' | 'guest'; status: 'active' | 'invited' | 'requested'; tariff: string; avatar?: string };
export type EmployeeSettings = { autoRecord: boolean; autoTranscript: boolean; recordingAccess: 'self' | 'participants' | 'link'; camera: boolean; microphone: boolean };
export type EmployeeDatabase = { version: 2; employees: Employee[]; settings: EmployeeSettings };
export const EMPLOYEE_STORAGE = 'mts-link-employee-database-v1';
const names = `Фома Йоркин
Иван Зеленолесов
Николай Зеленолесов
Эдуард Обрин
Филипп Селиванов
Матвей Белламин
Крис Стеноломов
Демьян Говоров
Вениамин Бутлеров
Регина Шоссейна
Родион Тростников-Парин
Тимофей Королёв
Еремей Гарин
Уильям Бутлеров
Бранислав Цветков
Давид Ключников
Марк Штормов
Роман Ванечкин
Михаил Шатов
Дементий Шрутин
Ярослав Калперов
Тамара Бислина
Андрей Бернадов
Ангелина Мартынова
Кузьма Малонин
Остап Мартынин
Родион Говоров
Станислав Худяков
Кира Капурова
Тимофей Флендеров
Климент Крыса
Фелиса Воснецова
Иван Дорин (И. Д.)
Крис Турков
Элла Редина
Пётр Коксов
Каролина Шипова
Роберт Кельцов
Дана Сальванова
Фёдор Бакланов
Дядя Гена, завхоз
Мартын Птицын
Вера Птицына
Каролина Птицына
Иона Птицын
Руфь Долгоморова
Вячеслав Долгоморов
Дарья Снегирёва
Яков Снегирёв
Рахиль Гарина
Елена Перцева
Вениамин Давыдов
Омар Наваров
Майя Мельникова
Роман Мелочёв
Сергей Маркин (Профессор)
Андрей Фонолёсов (Белгород)
Селена Оливина (Томск)
Агафья Хименова (Новосибирск)
Даниил Рамов (Дмитров)
Августин Рамов (Москва)
Антон Кортнев (Рязань)
Рахиль Мурилова (Липецк)
Марина Газданова (Ставрополь)
Мирослав Драгичев (Химки)
Радомир Драгичев (Омск)
Мартын Берестов (Пермь)
Артур Романов
Алиса Сьерова
Алина Морозова
Денис Волков
София Лебедева
Максим Орлов
Виктория Соколова`.split('\n');
// Original-name email aliases; Win/Will Butler collide, so Will receives suffix 2.
// Janitor has no supplied given name; use a single-word alias.
const emailAliases = 't.yorke j.greenwood c.greenwood e.obrien p.selway m.bellamy c.wolstenholme d.howard w.butler r.chassagne r.parry t.kingsbury j.gara w.butler2 b.flowers d.keuning m.stoermer r.vannucci m.scott d.schrute j.halpert p.beesly a.bernard a.martin k.malone o.martinez r.howard s.hudson k.kapoor t.flenderson c.bratton p.vance j.dorian c.turk e.reid p.cox c.espinosa b.kelso j.sullivan t.buckland janitor m.byrde w.byrde c.byrde j.byrde r.langmore w.langmore d.snell j.snell r.garrison h.pierce b.davis o.navarro m.miller r.petty s.marquina a.defonollosa s.oliveira a.jimenez d.ramos a.ramos a.cortes r.murillo m.gaztambide m.dragic r.dragic m.berrote a.roman a.sierra a.morozova d.volkov s.lebedeva m.orlov v.sokolova'.split(' ');
// Stable IDs are explicit by seed position: append new entries rather than reordering.
// The seed is read-only; every prototype session edits a deep copy.
export const employeeSeed = Object.freeze(names.map((name, i) => Object.freeze({
  id: `employee-${String(i + 1).padStart(3, '0')}`, name,
  email: `${emailAliases[i]}@dundermifflinpaper.com`,
  role: (i === 3 ? 'owner' : [0, 5].includes(i) ? 'admin' : i >= 69 ? 'guest' : 'employee') as Employee['role'],
  status: (i >= 69 ? 'active' : i >= 65 ? 'requested' : i >= 61 ? 'invited' : 'active') as Employee['status'],
  tariff: 'Встречи FREE',
})));
export function createEmployeeDatabase(): EmployeeDatabase {
  return { version: 2, employees: structuredClone(employeeSeed) as Employee[], settings: { autoRecord: false, autoTranscript: false, recordingAccess: 'participants', camera: false, microphone: false } };
}
export function loadEmployeeDatabase(): EmployeeDatabase {
  try {
    const value = JSON.parse(localStorage.getItem(EMPLOYEE_STORAGE) || 'null');
    if ([1, 2].includes(value?.version) && Array.isArray(value.employees) && value.employees.every((e: Employee) => e && typeof e.id === 'string' && typeof e.name === 'string' && typeof e.email === 'string' && typeof e.tariff === 'string' && ['owner','admin','employee','guest'].includes(e.role) && ['active','invited','requested'].includes(e.status)) && value.settings && ['autoRecord','autoTranscript','camera','microphone'].every(k => typeof value.settings[k] === 'boolean') && ['self','participants','link'].includes(value.settings.recordingAccess)) return value.version === 1 ? migrateEmployeeDatabase(value) : value;
  } catch { /* Unavailable/corrupt storage starts from the immutable seed. */ }
  return createEmployeeDatabase();
}
// Upgrade once without restoring deleted employees or losing approved requests/settings.
export function migrateEmployeeDatabase(db: Omit<EmployeeDatabase, 'version'> & { version: 1 }): EmployeeDatabase {
  const seedById = new Map<string, Readonly<Employee>>(employeeSeed.map(e => [e.id, e]));
  const employees = db.employees.map(e => ({ ...e,
    email: seedById.get(e.id)?.email ?? e.email,
    role: ['employee-039', 'employee-040', 'employee-041'].includes(e.id) ? 'employee' as const : e.role,
  }));
  const ids = new Set(employees.map(e => e.id));
  return { ...db, version: 2, employees: [...employees, ...employeeSeed.filter(e => e.role === 'guest' && !ids.has(e.id)).map(e => ({ ...e }))] };
}
export function removeEmployees(db: EmployeeDatabase, ids: string[]): EmployeeDatabase {
  return { ...db, employees: db.employees.filter(e => e.role === 'owner' || !ids.includes(e.id)) };
}
export function approveEmployee(db: EmployeeDatabase, id: string): EmployeeDatabase {
  return { ...db, employees: db.employees.map(e => e.id === id && e.status === 'requested' ? { ...e, status: 'active' } : e) };
}
export function employeeInitials(name: string) { return name.split(/[\s,(]+/).filter(Boolean).slice(0, 2).map(s => s[0]).join('').toLocaleUpperCase('ru'); }
