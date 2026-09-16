import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const src=(await readFile(new URL('../src/demos/pathfinder.js',import.meta.url),'utf8')).replace("import './pathfinder.css';",'');
const {searchGrid}=await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
function bfs(cols,rows,walls,start,end){if(walls.has(start)||walls.has(end))return null;const q=[[start,0]],seen=new Set([start]);for(let n=0;n<q.length;n++){const [i,d]=q[n];if(i===end)return d;for(const j of [i-1,i+1,i-cols,i+cols]){if(j<0||j>=cols*rows||walls.has(j)||seen.has(j))continue;if(Math.abs(j%cols-i%cols)+Math.abs(Math.floor(j/cols)-Math.floor(i/cols))!==1)continue;seen.add(j);q.push([j,d+1]);}}return null;}
let seed=92;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
for(let sample=0;sample<60;sample++){const cols=12,rows=8,start=0,end=cols*rows-1,walls=new Set();for(let i=1;i<end;i++)if(rand()<.27)walls.add(i);for(const algorithm of ['astar','dijkstra']){const result=searchGrid({cols,rows,walls,start,end,algorithm});assert.equal(result.distance,bfs(cols,rows,walls,start,end));assert.equal(result.found,result.distance!==null);for(let i=0;i<result.path.length;i++){assert(!walls.has(result.path[i]));if(i){const a=result.path[i-1],b=result.path[i];assert.equal(Math.abs(a%cols-b%cols)+Math.abs(Math.floor(a/cols)-Math.floor(b/cols)),1);}}}}
assert.equal(searchGrid({cols:5,rows:5,walls:new Set([10,11,12,13,14])}).found,false);
assert.equal(searchGrid({cols:1,rows:1}).distance,0);
console.log('PASS A* and Dijkstra match independent BFS on 60 seeded obstacle fields; valid adjacency, blocked route and singleton');
