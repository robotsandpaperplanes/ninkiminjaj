# Ready-to-use Codex prompts

Run tasks one at a time as needed; these are examples, not automatic workflows.

## Inspect configuration without changing code
> Review AGENTS.md and the six available profiles in .codex/agents. Summarize the delegation rules and any configuration issues. Do not spawn subagents or edit files.

## CSS consistency
> Use `ui_visuals` to identify and fix inconsistent typography, spacing and borders in the Employees table. Reuse the current design tokens. Preserve Russian copy and functionality. List changes and checks.

## Employees fixture data
> Ask `data_fixtures` to validate the synthetic Employees dataset: unique IDs and emails, group references and schema consistency. Fix only confirmed fixture issues; do not touch UI code.

## Behavior and pagination
> Use `product_logic` to implement the pagination requirements in the approved Employees specification. Keep filters/sorting intact and preserve styling. Validate the affected states.

## Text review
> Ask `ui_localization` to review Russian labels and error states in Security settings. Use approved terminology, preserve logic and CSS, and flag ambiguous security-related copy.

## Read-only code review
> Use `qa_reviewer` to review the current diff against the feature specification. Return prioritized reproducible regressions and uncovered test cases; do not modify code.

## Read-only architecture analysis
> Ask `architecture_reviewer` to compare table component reuse across Employees and Groups. Propose the smallest beneficial refactors, with evidence. Do not modify code.

## Cheap direct task
> Fix this single label typo directly. Do not spawn agents and do not alter unrelated files.
