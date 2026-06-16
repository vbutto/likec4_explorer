// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

/// <reference types="vite/client" />

declare const __likec4styles: Map<string, string>
declare const SHADOW_STYLE: string
/** Upstream LikeC4 release version, replaced at build time via Vite `define`. */
declare const __LIKEC4_VERSION__: string
/** This fork's own version (package.json "explorerVersion"), replaced at build time. */
declare const __EXPLORER_VERSION__: string

interface ImportMetaEnv {
  readonly VITE_KROKI_D2_SVG_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
