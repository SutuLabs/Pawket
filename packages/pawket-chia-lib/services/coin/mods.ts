import { Hex0x, prefix0x } from "./condition";
import { importModsHex, importModsProg, importModsHash, ImportModName } from "./importMods";
import { OtherModName, otherModsHash, otherModsHex, otherModsProg } from "./otherMods";
import { TibetModName, tibetModsHash, tibetModsHex, tibetModsProg } from "./tibetMods";
import { load } from 'js-yaml';
import { modsParametersYaml } from "./modsParametersYaml";

export interface ModParameter {
  name: string;
  desc?: string;
}

export interface ModDetail {
  name: ModName;
  parameters: ModParameter[];
}

const modsParameters: ModDetail[] = load(modsParametersYaml) as ModDetail[];

const allModsProg = Object.assign({}, importModsProg, otherModsProg, tibetModsProg);
const allModsHex = Object.assign({}, importModsHex, otherModsHex, tibetModsHex);
const allModsHash = Object.assign({}, importModsHash, otherModsHash, tibetModsHash);
const mods = Object.keys(allModsProg).map((_) => ({ name: _ as ModName }));

export type ModName = ImportModName | OtherModName | TibetModName;
export const modsdict: { [mod: string]: ModName } = mods.reduce((acc, cur) => ({ ...acc, [allModsProg[cur.name]]: cur.name }), {});
export const modsprog: { [name in ModName]: string } = mods.reduce((acc, cur) => ({ ...acc, [cur.name]: allModsProg[cur.name] }), {} as { [name in ModName]: string });
export const modsparams: { [name in ModName]: ModParameter[] | undefined } = mods.reduce((acc, cur) => ({ ...acc, [cur.name]: modsParameters.find(_ => _.name == cur.name)?.parameters }), {} as { [name in ModName]: ModParameter[] });
export const modshex: { [name in ModName]: string } = mods.reduce((acc, cur) => ({ ...acc, [cur.name]: allModsHex[cur.name] }), {} as { [name in ModName]: string });
export const modshex0x: { [name in ModName]: Hex0x } = mods.reduce((acc, cur) => ({ ...acc, [cur.name]: prefix0x(allModsHex[cur.name]) }), {} as { [name in ModName]: Hex0x });
export const modshexdict: { [mod_hex: string]: ModName } = mods.reduce((acc, cur) => ({ ...acc, [allModsHex[cur.name]]: cur.name }), {});
export const modshash: { [name in ModName]: Hex0x } = mods.reduce((acc, cur) => ({ ...acc, [cur.name]: prefix0x(allModsHash[cur.name]) }), {} as { [name in ModName]: Hex0x });
export const modshashdict: { [mod_hash: string]: ModName } = mods.reduce((acc, cur) => ({ ...acc, [allModsHash[cur.name]]: cur.name }), {});
