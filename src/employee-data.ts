export type Employee = { id: string; name: string; email: string; role: 'owner' | 'admin' | 'employee' | 'guest'; status: 'active' | 'invited' | 'requested'; tariff: string; avatar?: string; customFieldValues?: Record<string, string> };
export type EmployeeSettings = { autoRecord: boolean; autoTranscript: boolean; recordingAccess: 'self' | 'participants' | 'link'; camera: boolean; microphone: boolean };
export type EmployeeProfileFieldDraft = { name: string; hint: string; ssoKey: string };
export type EmployeeProfileField = EmployeeProfileFieldDraft & { id: string };
export type EmployeeDatabase = { version: 3; employees: Employee[]; settings: EmployeeSettings; profileFields: EmployeeProfileField[] };
export const EMPLOYEE_STORAGE = 'mts-link-employee-database-v1';

export const systemProfileFields = {
  firstName: 'Имя',
  patronymic: 'Отчество',
  lastName: 'Фамилия',
  displayName: 'Имя для мероприятий и чата',
  phone: 'Телефон',
  email: 'Электронная почта',
  organization: 'Организация',
  jobTitle: 'Должность',
  about: 'Коротко о себе',
} as const;

const baselineProfileFields = Object.freeze([
  Object.freeze({ id: 'profile-location', name: 'Локация', hint: '', ssoKey: '' }),
  Object.freeze({ id: 'profile-clearance', name: 'Уровень допуска', hint: '', ssoKey: '' }),
]);

function loadProfileFields(value: unknown): EmployeeProfileField[] {
  if (Array.isArray(value) && value.every(field => field && ['id', 'name', 'hint', 'ssoKey'].every(key => typeof field[key] === 'string'))) {
    return value;
  }
  return baselineProfileFields.map(field => ({ ...field }));
}

export function saveEmployeeProfileField(db: EmployeeDatabase, field: EmployeeProfileField, editing: boolean): EmployeeDatabase {
  const name = field.name.trim();
  const exists = db.profileFields.some(current => current.id === field.id);
  if (!name || editing !== exists) return db;
  const definition = { ...field, name };
  return {
    ...db,
    profileFields: editing
      ? db.profileFields.map(current => current.id === field.id ? definition : current)
      : [...db.profileFields, definition],
  };
}

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
// New identities are fixed fixtures. Latin originals supply deterministic email aliases only.
export const addedIdentities = `Гарри Поттер|Harry|Potter
Гермиона Грейнджер|Hermione|Granger
Рон Уизли|Ron|Weasley
Джинни Уизли|Ginny|Weasley
Фред Уизли|Fred|Weasley
Джордж Уизли|George|Weasley
Молли Уизли|Molly|Weasley
Артур Уизли|Arthur|Weasley
Альбус Дамблдор|Albus|Dumbledore
Северус Снейп|Severus|Snape
Минерва Макгонагалл|Minerva|McGonagall
Рубеус Хагрид|Rubeus|Hagrid
Драко Малфой|Draco|Malfoy
Люциус Малфой|Lucius|Malfoy
Нарцисса Малфой|Narcissa|Malfoy
Сириус Блэк|Sirius|Black
Римус Люпин|Remus|Lupin
Нимфадора Тонкс|Nymphadora|Tonks
Беллатриса Лестрейндж|Bellatrix|Lestrange
Невилл Долгопупс|Neville|Longbottom
Полумна Лавгуд|Luna|Lovegood
Седрик Диггори|Cedric|Diggory
Чжоу Чанг|Cho|Chang
Флёр Делакур|Fleur|Delacour
Виктор Крам|Viktor|Krum
Люк Скайуокер|Luke|Skywalker
Лея Органа|Leia|Organa
Хан Соло|Han|Solo
Энакин Скайуокер|Anakin|Skywalker
Падме Амидала|Padme|Amidala
Оби-Ван Кеноби|Obi-Wan|Kenobi
Бен Соло|Ben|Solo
Лэндо Калриссиан|Lando|Calrissian
Кассиан Андор|Cassian|Andor
Джин Эрсо|Jyn|Erso
Мон Мотма|Mon|Mothma
Бейл Органа|Bail|Organa
Гера Синдулла|Hera|Syndulla
Сабин Врен|Sabine|Wren
Эзра Бриджер|Ezra|Bridger
Дин Джарин|Din|Djarin
Бо-Катан Крайз|Bo-Katan|Kryze
Асока Тано|Ahsoka|Tano
Квай-Гон Джинн|Qui-Gon|Jinn
Мейс Винду|Mace|Windu
Тони Старк|Tony|Stark
Стив Роджерс|Steve|Rogers
Наташа Романофф|Natasha|Romanoff
Брюс Бэннер|Bruce|Banner
Клинт Бартон|Clint|Barton
Тор Одинсон|Thor|Odinson
Ванда Максимофф|Wanda|Maximoff
Пьетро Максимофф|Pietro|Maximoff
Питер Паркер|Peter|Parker
Стивен Стрэндж|Stephen|Strange
Скотт Лэнг|Scott|Lang
Хоуп ван Дайн|Hope|Van Dyne
Хэнк Пим|Hank|Pym
Джанет ван Дайн|Janet|Van Dyne
Сэм Уилсон|Sam|Wilson
Баки Барнс|Bucky|Barnes
Ник Фьюри|Nick|Fury
Мария Хилл|Maria|Hill
Кэрол Дэнверс|Carol|Danvers
Камала Хан|Kamala|Khan
Елена Белова|Yelena|Belova
Кейт Бишоп|Kate|Bishop
Мэтт Мёрдок|Matt|Murdock
Фрэнк Касл|Frank|Castle
Джессика Джонс|Jessica|Jones
Джон Сноу|Jon|Snow
Дейенерис Таргариен|Daenerys|Targaryen
Тирион Ланнистер|Tyrion|Lannister
Серсея Ланнистер|Cersei|Lannister
Джейме Ланнистер|Jaime|Lannister
Тайвин Ланнистер|Tywin|Lannister
Санса Старк|Sansa|Stark
Арья Старк|Arya|Stark
Бран Старк|Bran|Stark
Робб Старк|Robb|Stark
Эддард Старк|Eddard|Stark
Кейтилин Старк|Catelyn|Stark
Роберт Баратеон|Robert|Baratheon
Станнис Баратеон|Stannis|Baratheon
Ренли Баратеон|Renly|Baratheon
Джоффри Баратеон|Joffrey|Baratheon
Маргери Тирелл|Margaery|Tyrell
Оленна Тирелл|Olenna|Tyrell
Сандор Клиган|Sandor|Clegane
Грегор Клиган|Gregor|Clegane
Сэмвелл Тарли|Samwell|Tarly
Теон Грейджой|Theon|Greyjoy
Яра Грейджой|Yara|Greyjoy
Давос Сиворт|Davos|Seaworth
Джорах Мормонт|Jorah|Mormont
Рейчел Грин|Rachel|Green
Моника Геллер|Monica|Geller
Фиби Буффе|Phoebe|Buffay
Джоуи Триббиани|Joey|Tribbiani
Чендлер Бинг|Chandler|Bing
Росс Геллер|Ross|Geller
Уолтер Уайт|Walter|White
Джесси Пинкман|Jesse|Pinkman
Скайлер Уайт|Skyler|White
Хэнк Шрейдер|Hank|Schrader
Мари Шрейдер|Marie|Schrader
Густаво Фринг|Gustavo|Fring
Майк Эрмантраут|Mike|Ehrmantraut
Сол Гудман|Saul|Goodman
Ким Уэкслер|Kim|Wexler
Говард Хэмлин|Howard|Hamlin
Майк Уилер|Mike|Wheeler
Дастин Хендерсон|Dustin|Henderson
Лукас Синклер|Lucas|Sinclair
Уилл Байерс|Will|Byers
Джонатан Байерс|Jonathan|Byers
Джойс Байерс|Joyce|Byers
Джим Хоппер|Jim|Hopper
Макс Мэйфилд|Max|Mayfield
Билли Харгроув|Billy|Hargrove
Нэнси Уилер|Nancy|Wheeler
Карен Уилер|Karen|Wheeler
Стив Харрингтон|Steve|Harrington
Робин Бакли|Robin|Buckley
Эдди Мансон|Eddie|Munson
Эрика Синклер|Erica|Sinclair`.split('\n').map(line => {
  const [name, first, last] = line.split('|');
  return { name, first, last };
});
function addedEmployees(existingEmails: ReadonlySet<string>): Readonly<Employee>[] {
  const used = new Set(existingEmails);
  return addedIdentities.map(({ name, first, last }, index) => {
    const normalizedLast = last.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/gi, '').toLowerCase();
    const base = `${first[0].toLowerCase()}.${normalizedLast}`;
    let email = `${base}@dundermifflinpaper.com`;
    for (let suffix = 2; used.has(email); suffix++) email = `${base}${suffix}@dundermifflinpaper.com`;
    used.add(email);
    return Object.freeze({ id: `employee-${String(index + 75).padStart(3, '0')}`, name, email,
      role: 'employee' as const, status: 'active' as const, tariff: 'Встречи FREE' });
  });
}
// Stable IDs are explicit by seed position: append new entries rather than reordering.
// The seed is read-only; every prototype session edits a deep copy.
const originalEmployeeSeed = Object.freeze(names.map((name, i) => Object.freeze({
  id: `employee-${String(i + 1).padStart(3, '0')}`, name,
  email: `${emailAliases[i]}@dundermifflinpaper.com`,
  role: (i === 3 ? 'owner' : [0, 5].includes(i) ? 'admin' : i >= 69 ? 'guest' : 'employee') as Employee['role'],
  status: (i >= 69 ? 'active' : i >= 65 ? 'requested' : i >= 61 ? 'invited' : 'active') as Employee['status'],
  tariff: 'Встречи FREE',
})));
export const employeeSeed = Object.freeze([...originalEmployeeSeed, ...addedEmployees(new Set(originalEmployeeSeed.map(e => e.email)))]);
export function createEmployeeDatabase(): EmployeeDatabase {
  return {
    version: 3,
    employees: structuredClone(employeeSeed) as Employee[],
    settings: { autoRecord: false, autoTranscript: false, recordingAccess: 'participants', camera: false, microphone: false },
    profileFields: loadProfileFields(undefined),
  };
}
export function loadEmployeeDatabase(): EmployeeDatabase {
  try {
    const value = JSON.parse(localStorage.getItem(EMPLOYEE_STORAGE) || 'null');
    if ([1, 2, 3].includes(value?.version) && Array.isArray(value.employees) && value.employees.every((e: Employee) => e && typeof e.id === 'string' && typeof e.name === 'string' && typeof e.email === 'string' && typeof e.tariff === 'string' && ['owner','admin','employee','guest'].includes(e.role) && ['active','invited','requested'].includes(e.status)) && value.settings && ['autoRecord','autoTranscript','camera','microphone'].every(k => typeof value.settings[k] === 'boolean') && ['self','participants','link'].includes(value.settings.recordingAccess)) {
      return value.version === 3
        ? { ...value, profileFields: loadProfileFields(value.profileFields) }
        : migrateEmployeeDatabase(value);
    }
  } catch { /* Unavailable/corrupt storage starts from the immutable seed. */ }
  return createEmployeeDatabase();
}
// Upgrade v1 aliases and guest conversion first, then append only the new v3 IDs.
// A v2 working copy may have intentional deletions; they stay deleted.
export function migrateEmployeeDatabase(db: { version: 1 | 2; employees: Employee[]; settings: EmployeeSettings; profileFields?: unknown }): EmployeeDatabase {
  let employees = db.employees.map(e => ({ ...e }));
  if (db.version === 1) {
    const seedById = new Map<string, Readonly<Employee>>(originalEmployeeSeed.map(e => [e.id, e]));
    employees = employees.map(e => ({ ...e,
      email: seedById.get(e.id)?.email ?? e.email,
      role: ['employee-039', 'employee-040', 'employee-041'].includes(e.id) ? 'employee' as const : e.role,
    }));
    const ids = new Set(employees.map(e => e.id));
    employees.push(...originalEmployeeSeed.filter(e => e.role === 'guest' && !ids.has(e.id)).map(e => ({ ...e })));
  }
  const ids = new Set(employees.map(e => e.id));
  employees.push(...employeeSeed.slice(74).filter(e => !ids.has(e.id)).map(e => ({ ...e })));
  return { version: 3, employees, settings: { ...db.settings }, profileFields: loadProfileFields(db.profileFields) };
}
export function removeEmployees(db: EmployeeDatabase, ids: string[]): EmployeeDatabase {
  return { ...db, employees: db.employees.filter(e => e.role === 'owner' || !ids.includes(e.id)) };
}
export function approveEmployee(db: EmployeeDatabase, id: string): EmployeeDatabase {
  return { ...db, employees: db.employees.map(e => e.id === id && e.status === 'requested' ? { ...e, status: 'active' } : e) };
}
export function employeeInitials(name: string) { return name.split(/[\s,(]+/).filter(Boolean).slice(0, 2).map(s => s[0]).join('').toLocaleUpperCase('ru'); }
