# Codex Agents для админ-панели МТС Линк

Этот архив содержит **только инструкции и конфигурацию** для существующего Git-репозитория. Код прототипа, спецификации и пользовательские данные в архив не включены.

## Содержимое

```text
AGENTS.md
.codex/
  config.toml
  agents/
    ui_visuals.toml
    product_logic.toml
    qa_reviewer.toml
    data_fixtures.toml
    ui_localization.toml
    architecture_reviewer.toml
README.md
EXAMPLE_TASKS.md
```

## Установка

1. Создайте резервную копию или коммит последней версии прототипа.
2. Распакуйте ZIP **в корень репозитория**, то есть рядом с исходными файлами проекта, а не в новую вложенную папку.
3. Если уже существуют `AGENTS.md` или `.codex/config.toml`, **не перезаписывайте** их: объедините соответствующие инструкции и раздел `[agents]` вручную.
4. Убедитесь, что `.codex/agents/*.toml` лежат внутри репозитория; сохраните файлы в Git отдельным коммитом.
5. Откройте этот репозиторий в Codex. При необходимости начните новый чат, чтобы обнаружились новые профили.
6. Запустите одну узкую задачу из `EXAMPLE_TASKS.md`. Не нужно активировать все шесть профилей.

На macOS папка `.codex` скрытая; в Finder используйте `Cmd + Shift + .` для показа скрытых файлов.

## Роли

| Имя | Назначение |
| --- | --- |
| `ui_visuals` | CSS, стили, отступы, общие компоненты |
| `product_logic` | Сценарии, взаимодействия, валидация, правила |
| `qa_reviewer` | Независимая проверка без правок кода |
| `data_fixtures` | Синтетические сотрудники, группы, роли |
| `ui_localization` | Русские тексты, терминология, ключи |
| `architecture_reviewer` | Анализ архитектуры без правок кода |

## Ресурсы

`max_concurrent_threads_per_session = 2` ограничивает одновременно открытые потоки субагентов (основной агент — отдельно). **Создание шести профилей не запускает их.** Не назначены конкретные модели: субагенты наследуют настройки главной сессии. Запущенные агенты расходуют собственный контекст и токены.

## Как попросить Codex использовать профиль

- `Use ui_visuals to fix spacing inconsistencies in the Employees table. Preserve logic and Russian copy.`
- `Ask qa_reviewer to review the current diff for regressions. Do not change files.`
- `Do this small edit directly without spawning subagents.`

## Ограничения

Этот шаблон не проходил проверку на реальном коде прототипа — после установки адаптируйте инструкции к архитектуре проекта. Поведенческий запрет на редактирование для `qa_reviewer` и `architecture_reviewer` не заменяет настройки прав доступа/sandbox. Не публикуйте внутренние данные без разрешения компании.

## Проверка синтаксиса

Для Python 3.11+ в корне репозитория:

```bash
python3 -c 'import tomllib,pathlib; ps=[pathlib.Path(".codex/config.toml"),*pathlib.Path(".codex/agents").glob("*.toml")]; [tomllib.loads(p.read_text()) for p in ps]; print("Validated",len(ps),"TOML files")'
```

## Документация OpenAI

- https://learn.chatgpt.com/docs/agent-configuration/subagents
- https://learn.chatgpt.com/docs/agent-configuration/agents-md
- https://learn.chatgpt.com/docs/config-file/config-reference
