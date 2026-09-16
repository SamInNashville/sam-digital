import assert from 'node:assert/strict';
import {addFlightDepth,depthScale,flightTransform,planPetFlyby} from '../src/pet-depth.js';
import {planPetFlight} from '../src/pet-flight.js';
import {createEmittedBubble,THRUST} from '../src/pet-bubbles.js';
const original={kind:'parabola',duration:3000,points:[{x:100,y:120,offset:0},{x:300,y:180,offset:.5},{x:500,y:120,offset:1}]};
for(const width of [390,1440])for(const trip of [0,1]){
 const decorated=addFlightDepth(original,{width,trip,distance:400});
 assert.deepEqual(decorated.points.map(p=>p.offset),original.points.map(p=>p.offset));assert.equal(decorated.points[0].x,original.points[0].x);assert.equal(decorated.points.at(-1).x,original.points.at(-1).x);assert.equal(decorated.duration,original.duration);
 assert.equal(decorated.points[0].z,0);assert.equal(decorated.points.at(-1).z,0);
 assert(trip?decorated.points[1].z>0:decorated.points[1].z<0);
 const height=width===390?844:1000;
 for(const [from,to] of [[{x:10,y:12},{x:width-92,y:height-110}],[{x:width-92,y:12},{x:10,y:height-110}],[{x:100,y:200},{x:width-120,y:500}]]){
  const journey=planPetFlight(from,to,{width,height,trip});
  for(const p of journey.points){const scale=depthScale(p.z);assert(scale>=.53&&scale<=2.67);assert(p.x+41-41*scale>=-1e-6);assert(p.x+41+41*scale<=width+1e-6);assert(p.y+49-49*scale>=-1e-6);assert(p.y+49+49*scale<=height+1e-6);}
 }
}
const emitter={x:500,y:500,podOffset:20,vx:5,vy:8,moving:true};
for(let sample=0;sample<4;sample++){
 const far=createEmittedBubble({...emitter,scale:depthScale(-200)},sample),near=createEmittedBubble({...emitter,scale:depthScale(80)},sample),flat=createEmittedBubble({...emitter,scale:1},sample);
 assert(far.size<flat.size&&flat.size<near.size);assert(far.vy<flat.vy&&flat.vy<near.vy);assert.equal(flat.vy,emitter.vy+THRUST.flight);assert.equal(far.x,near.x,'Measured screen-space pods are not scaled twice');
}
assert(flightTransform({x:20,y:30,z:-100}).includes('perspective(640px) translateZ(-100px)'));
console.log('PASS expressive depth preserves endpoints/time, rests at z=0, approaches/recedes within projected bounds, and scales bubble birth size/thrust');

for(const [width,height] of [[320,568],[390,844],[1440,1000]]){const from={x:10,y:12};const flyby=planPetFlyby(from,{width,height});assert.deepEqual(flyby.points[0],{...from,offset:0,z:0});assert.deepEqual(flyby.points.at(-1),{...from,offset:1,z:0});assert(Math.max(...flyby.points.map(p=>depthScale(p.z)))>=1.9);for(const p of flyby.points){const scale=depthScale(p.z);assert(p.x+41-41*scale>=0&&p.x+41+41*scale<=width);assert(p.y+49-49*scale>=0&&p.y+49+49*scale<=height);}}
assert(planPetFlight({x:100,y:100},{x:800,y:300},{width:1440,height:1000,trip:1,quiet:true}).points.every(p=>p.z===0));
