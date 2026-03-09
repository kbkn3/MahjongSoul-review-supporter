declare module '*.vue' {
    import type { DefineComponent } from 'vue';
    const component: DefineComponent<object, object, unknown>;
    export default component;
}

/** 雀魂ゲームクライアントが提供するグローバル変数 */
/* eslint-disable @typescript-eslint/no-explicit-any */
declare const app: any;
declare const GameMgr: any;
declare const cfg: any;
declare const net: any;
/* eslint-enable @typescript-eslint/no-explicit-any */
