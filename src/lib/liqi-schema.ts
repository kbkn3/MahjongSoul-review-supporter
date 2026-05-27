// pbjs static-module (eval 不使用) で生成した lq 名前空間を再エクスポートする。
// reflection (Root.fromJSON + lookupType().decode) は protobufjs が new Function でデコード関数を
// 動的生成するため MV3 の CSP(unsafe-eval 不可)に抵触する。静的生成クラスの .decode() は eval を含まない。
export { lq } from "../assets/majsoul/liqi-proto";
