import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    showBottomNav?: boolean
    /** Main content fills width below app bar (settings lists). */
    shellFullBleed?: boolean
  }
}

export {}
