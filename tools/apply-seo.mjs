#!/usr/bin/env node
/* Generates all SEO + GitHub Pages files from seo.config.json (no dependencies).
   Usage:  node tools/apply-seo.mjs [--strict] [--root DIR] [--config FILE]
   Writes: <head> SEO block in index.html, robots.txt, sitemap.xml, 404.html, .nojekyll
   --strict exits with an error while siteUrl is still a placeholder (used by the GitHub Action). */
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {execSync} from 'node:child_process';
const A=process.argv.slice(2),arg=(n,d)=>{const i=A.indexOf(n);return i>-1?A[i+1]:d};
const root=path.resolve(arg('--root',path.join(path.dirname(fileURLToPath(import.meta.url)),'..')));
const cfg=JSON.parse(fs.readFileSync(path.resolve(arg('--config',path.join(root,'seo.config.json'))),'utf8'));
const warn=[],missing=v=>!v||/REPLACE|YOUR-|^\s*$/i.test(v);
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;'),J=JSON.stringify;
const rd=f=>fs.readFileSync(path.join(root,f),'utf8'),wr=(f,t)=>fs.writeFileSync(path.join(root,f),t);
/* ---- social links + e-mail come from index.html [EDIT-1B] (the only place you edit them) ---- */
{const m=rd('index.html').match(/<template id="data-contact">([\s\S]*?)<\/template>/);if(m){cfg.social={};m[1].replace(/<li[^>]*data-key="(\w+)"[^>]*>\s*<a[^>]*href="([^"]*)"/g,(x,k,u)=>{u=u.trim();if(k==='email')cfg.email=u.replace(/^mailto:/i,'');else if(u)cfg.social[k]=u})}}
/* ---- public site URL (never a github.com repository URL) ---- */
let site='';
if(!missing(cfg.siteUrl)){try{const u=new URL(cfg.siteUrl.trim());const local=/^(localhost|127\.0\.0\.1)$/.test(u.hostname);
  if(u.protocol!=='https:'&&!local)throw new Error('must be https');if(u.hostname==='github.com'||u.hostname==='www.github.com')throw new Error('that is a repository URL, not the public site URL');
  u.hash='';u.search='';if(!u.pathname.endsWith('/'))u.pathname+='/';site=u.href}catch(e){warn.push('siteUrl ignored: '+e.message)}}
/* ---- verified social profiles: only valid https URLs on the expected domains ---- */
const dom={instagram:/(^|\.)instagram\.com$/,facebook:/(^|\.)(facebook|fb)\.com$/,tiktok:/(^|\.)tiktok\.com$/,whatsapp:/^(wa\.me|(www\.)?whatsapp\.com|api\.whatsapp\.com)$/};
const social={};for(const k in dom){const v=cfg.social&&cfg.social[k];if(missing(v))continue;try{const u=new URL(v.trim());if(u.protocol==='https:'&&dom[k].test(u.hostname))social[k]=u.href;else warn.push(`social.${k} ignored (not an https ${k} URL)`)}catch(e){warn.push(`social.${k} ignored (invalid URL)`)}}
const sameAs=['instagram','facebook','tiktok'].filter(k=>social[k]).map(k=>social[k]);   // WhatsApp is a contact link, not a public profile
const email=missing(cfg.email)?'':cfg.email.trim().split(' ')[0];
const igUser=social.instagram?'@'+(new URL(social.instagram).pathname.split('/').filter(Boolean)[0]||''):'—';
const waNum=(()=>{if(!social.whatsapp)return'—';const u=new URL(social.whatsapp),n=(u.hostname==='wa.me'?u.pathname:u.searchParams.get('phone')||'').replace(/\D/g,'');return n?'+'+n:'—'})();
/* ---- <head> SEO block ---- */
const T=cfg.title,D=cfg.description,abs=p=>new URL(p,site).href,ogAlt=`${cfg.brandName} - ${cfg.personName}, ${cfg.jobTitle}`;
let ld='';
if(site){const pid=site+'#person',oid=site+'#org',graph=[
  {'@type':'WebSite','@id':site+'#website',url:site,name:cfg.brandName,alternateName:[cfg.personName],inLanguage:['en','ar'],publisher:{'@id':oid}},
  {'@type':'Organization','@id':oid,name:cfg.brandName,url:site,logo:{'@type':'ImageObject',url:abs(cfg.logo)},founder:{'@id':pid},...(sameAs.length?{sameAs}:{})},
  {'@type':'Person','@id':pid,name:cfg.personName,jobTitle:cfg.jobTitle,url:site,address:{'@type':'PostalAddress',addressCountry:cfg.country},worksFor:{'@id':oid},...(sameAs.length?{sameAs}:{})}];
  ld=`<script type="application/ld+json">\n${J({'@context':'https://schema.org','@graph':graph},null,2).replace(/</g,'\\u003c')}\n</script>`}
const head=[`<title>${esc(T)}</title>`,`<meta name="description" content="${esc(D)}">`,`<meta name="robots" content="index,follow,max-image-preview:large">`,
 `<meta name="author" content="${esc(cfg.personName)}">`,`<meta name="application-name" content="${esc(cfg.brandName)}">`,
 site&&`<link rel="canonical" href="${site}">`,!missing(cfg.googleSiteVerification)&&`<meta name="google-site-verification" content="${esc(cfg.googleSiteVerification.trim())}">`,
 `<link rel="icon" href="favicon.ico" sizes="48x48">`,`<link rel="icon" type="image/png" sizes="192x192" href="assets/seo/favicon-192.png">`,`<link rel="apple-touch-icon" href="assets/seo/apple-touch-icon.png">`,
 `<meta property="og:type" content="website">`,`<meta property="og:site_name" content="${esc(cfg.brandName)}">`,`<meta property="og:title" content="${esc(T)}">`,`<meta property="og:description" content="${esc(D)}">`,
 `<meta property="og:locale" content="en_US">`,`<meta property="og:locale:alternate" content="ar_EG">`,
 site&&`<meta property="og:url" content="${site}">`,site&&`<meta property="og:image" content="${abs(cfg.ogImage)}">`,site&&`<meta property="og:image:width" content="1200">`,site&&`<meta property="og:image:height" content="630">`,site&&`<meta property="og:image:alt" content="${esc(ogAlt)}">`,
 `<meta name="twitter:card" content="summary_large_image">`,`<meta name="twitter:title" content="${esc(T)}">`,`<meta name="twitter:description" content="${esc(D)}">`,site&&`<meta name="twitter:image" content="${abs(cfg.ogImage)}">`,ld].filter(Boolean).join('\n');
let h=rd('index.html');const re=/<!-- SEO:START[\s\S]*?<!-- SEO:END -->/;if(!re.test(h))throw new Error('SEO markers missing in index.html');
wr('index.html',h.replace(re,()=>`<!-- SEO:START (generated by tools/apply-seo.mjs from seo.config.json - do not edit by hand) -->\n${head}\n<!-- SEO:END -->`));
/* ---- robots.txt / sitemap.xml / 404.html / .nojekyll ---- */
wr('robots.txt',`User-agent: *\nAllow: /\n`+(site?`\nSitemap: ${site}sitemap.xml\n`:`\n# Sitemap line is added once siteUrl is set in seo.config.json\n`));
const sm=path.join(root,'sitemap.xml');
if(site){let lm='';try{lm=execSync('git log -1 --format=%cs',{cwd:root,stdio:['ignore','pipe','ignore']}).toString().trim()}catch(e){}
  wr('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${site}</loc>${/^\d{4}-\d\d-\d\d$/.test(lm)?`\n    <lastmod>${lm}</lastmod>`:''}\n  </url>\n</urlset>\n`)}
else if(fs.existsSync(sm))fs.unlinkSync(sm);
wr('404.html',`<!DOCTYPE html>\n<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page not found | ${esc(cfg.brandName)}</title><meta name="robots" content="noindex">\n<style>html,body{height:100%;margin:0;background:#02030a;color:#e9edff;font-family:Inter,"Segoe UI",system-ui,sans-serif;font-weight:300}body{display:grid;place-content:center;text-align:center;gap:1rem;padding:1rem}img{width:96px;margin:0 auto}h1{font-weight:300;letter-spacing:.2em;font-size:1.3rem;margin:0}p{color:#9aa6c8;margin:0}a{display:inline-block;margin-top:.5rem;color:#e9edff;border:1px solid #9fb4ff44;border-radius:99px;padding:.6rem 1.4rem;text-decoration:none}</style></head>\n<body>${site?`<img src="${abs(cfg.logo)}" alt="${esc(cfg.brandName)}">`:''}<h1>404 - PAGE NOT FOUND</h1><p>The page you are looking for does not exist.</p>${site?`<a href="${site}">Back to ${esc(cfg.brandName)}</a>`:''}</body></html>\n`);
wr('.nojekyll','');
/* ---- report ---- */
const miss=['instagram','facebook','tiktok','whatsapp'].filter(k=>!social[k]);
console.log(site?`OK  siteUrl: ${site}`:'!!  siteUrl is NOT set: canonical, og:url/og:image, JSON-LD and sitemap.xml were skipped');
console.log('sameAs:',sameAs.length?sameAs.join(', '):'(none)');if(miss.length)console.log('Missing/ignored social links:',miss.join(', '));warn.forEach(x=>console.log('warning:',x));
if(A.includes('--strict')&&!site){console.error('\nSTRICT: set a real "siteUrl" in seo.config.json before deploying.');process.exit(1)}
