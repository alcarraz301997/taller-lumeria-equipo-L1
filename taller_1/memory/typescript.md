# TypeScript Rules

verbatimModuleSyntax:
- Use import type

erasableSyntaxOnly:
- No enums
- No namespaces
- No parameter properties

Compiler:
- target es2023
- module esnext
- moduleResolution bundler

Strict:
- noUnusedLocals
- noUnusedParameters