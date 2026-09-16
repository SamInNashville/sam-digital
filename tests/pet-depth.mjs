import assert from 'node:assert/strict';
import {addFlightDepth,depthScale,flightTransform} from '../src/pet-depth.js';
import {planPetFlight} from '../src/pet-flight.js';
import {createEmittedBubble,THRUST} from '../src/pet-bubbles.js';
const original={kind:'parabola',duration:3000,points:[{x:100,y:120,offset:0},{x:300,y:180,offset:.5},{x:500,y:120,offset:1}]};
for(const width of [390,1440])for(const trip of [0,1]){
 const decorated=addFlightDepth(original,{width,trip,distance:400});
 assert.deepEqual(decorated.points.map(({z,...p})=>p),original.points);assert.equal(decorated.duration,original.duration);
 assert.equal(decorated.points[0].z,0);assert.equal(decorated.points.at(-1).z,0);
 assert(trip?decorated.points[1].z>0:decorated.points[1].z<0);
 const height=width===390?844:1000;
 for(const [from,to] of [[{x:10,y:12},{x:width-92,y:height-110}],[{x:width-92,y:12},{x:10,y:height-110}],[{x:100,y:200},{x:width-120,y:500}]]){
  const journey=planPetFlight(from,to,{width,height,trip});
  for(const p of journey.points){const scale=depthScale(p.z);assert(scale>=.76&&scale<=1.15);assert(p.x+41-41*scale>=-1e-6);assert(p.x+41+41*scale<=width+1e-6);assert(p.y+49-49*scale>=-1e-6);assert(p.y+49+49*scale<=height+1e-6);}
 }
}
const emitter={x:500,y:500,podOffset:20,vx:5,vy:8,moving:true};
for(let sample=0;sample<4;sample++){
 const far=createEmittedBubble({...emitter,scale:depthScale(-200)},sample),near=createEmittedBubble({...emitter,scale:depthScale(80)},sample),flat=createEmittedBubble({...emitter,scale:1},sample);
 assert(far.size<flat.size&&flat.size<near.size);assert(far.vy<flat.vy&&flat.vy<near.vy);assert.equal(flat.vy,emitter.vy+THRUST.flight);assert.equal(far.x,near.x,'Measured screen-space pods are not scaled twice');
}
assert(flightTransform({x:20,y:30,z:-100}).includes('perspective(640px) translateZ(-100px)'));
console.log('PASS depth preserves XY/time, rests at z=0, approaches/recedes within projected bounds, and scales bubble birth size/thrust');
