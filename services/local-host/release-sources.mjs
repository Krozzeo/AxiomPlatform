import {assert} from '../../packages/contracts/index.mjs';
export const defaultSources=Object.freeze([
 {productId:'axiom.platform',name:'Axiom Platform',repository:'Krozzeo/AxiomPlatform'},
 {productId:'axiom.game-engine',name:'Axiom Game Engine',repository:'Krozzeo/AxiomGameEngine'},
 {productId:'axiom.math-lab',name:'Axiom Math Lab',repository:'Krozzeo/AxiomMathLab'},
 {productId:'axiom.engineer-cad',name:'Axiom Engineer CAD',repository:'Krozzeo/AxiomEngineerCAD',availability:'planned'}
]);
export function releaseSources(overrides={}){
 assert(overrides&&typeof overrides==='object'&&!Array.isArray(overrides)&&Object.keys(overrides).every(id=>defaultSources.some(s=>s.productId===id)),'invalidRequest','Choose release sources for known Axiom products.');
 return defaultSources.map(source=>{let repository=source.repository;const value=overrides[source.productId];if(value!==undefined){assert(typeof value==='string'&&value.length<=1024,'invalidRequest','Enter a GitHub repository URL.');let url;try{url=new URL(value);}catch{assert(false,'invalidRequest','Enter a valid HTTPS GitHub repository URL.');}assert(url.protocol==='https:'&&!url.port&&!url.username&&!url.password&&!url.search&&!url.hash,'invalidRequest','Use a public HTTPS GitHub repository URL without credentials or query parameters.');const path=url.hostname==='github.com'?url.pathname.replace(/\/(?:releases)?\/?$/,'').replace(/\.git$/,''):url.hostname==='api.github.com'&&url.pathname.startsWith('/repos/')?url.pathname.replace(/^\/repos\//,'/').replace(/\/releases\/?$/,''):'';assert(/^\/[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9_][A-Za-z0-9_.-]*$/.test(path),'invalidRequest','Use a github.com repository or its api.github.com releases URL.');repository=path.slice(1);}
  return {...source,repository,url:'https://github.com/'+repository,defaultUrl:'https://github.com/'+source.repository};
 });
}
