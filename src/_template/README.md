# Domain Template

This folder described how we structure our "Domain" folders.

```mermaid
flowchart

direction TB

entropy-base:::base

subgraph example[ ]
  direction TB
  
  types
  main
  command
  interaction

  constants:::optional
  utils:::optional
  
  main --> command & interaction
end

entropy-base --> main

classDef default fill:#B0B, stroke:none, color:#FFF;
classDef base fill:none, stroke:#000, color:#000;
classDef optional fill:#B9B, stroke:none;
classDef cluster fill:none, stroke:#B0B;
```
_Diagram showing the required + optional files, and key dependencies._


- `main.ts` - the core functions used by the flow (inherits from `EntropyBase`)
- `command.ts` - the programmatic CLI functions (depends on `main.ts`)
- `interactions.ts` - the TUI (text user interface) functions (depends on `main.ts`)
- `types.ts` - all the types/interfaces used in this flow
- `constants.ts` (optional) - constants used in this flow
- `utils.ts` (optional) - help function used in this flow
