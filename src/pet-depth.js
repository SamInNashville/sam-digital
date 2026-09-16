// Perspective for the existing flat SVG, not a new 3D character or scene.
export const PET_PERSPECTIVE = 640;
export const depthScale = (z=0) => PET_PERSPECTIVE / (PET_PERSPECTIVE-z);
export const flightTransform = ({x,y,z=0}) => `translate3d(${x}px,${y}px,0) perspective(${PET_PERSPECTIVE}px) translateZ(${z}px)`;

export function addFlightDepth(journey,{width,trip=0,distance=0}={}){
  const near=trip%2===1;
  const reach=Math.min(1,Math.max(0,distance)/320);
  const amplitude=(near?(width<680?50:80):(width<680?-160:-200))*reach;
  const points=journey.points.map((p,i)=>({
    ...p,
    // Zero depth and zero depth velocity at both ends keep speech perches stable.
    z:i===0||i===journey.points.length-1?0:amplitude*Math.sin(Math.PI*p.offset)**2
  }));
  return {...journey,points,depthKind:amplitude?(near?'near':'far'):'rest'};
}
