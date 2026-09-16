// Authored combinations, not model-generated claims. No transcript or network access.
const variations=(first,openers,endings)=>Object.freeze([first,...openers.flatMap(a=>endings.map(b=>`${a} ${b}`)).filter(s=>s!==first)].slice(0,100));
export const PHRASES=Object.freeze({
 services:variations("Well, that's pretty vague.",[
  'A conversation. Then something useful.', 'Apparently, useful is the plan.', 'That is a suspiciously tidy summary.', 'Quite a lot hiding in two sentences.', 'Ah, the website explaining itself.', 'Strong words. Very few of them.', 'They kept the explanation compact.', 'This section is playing it cool.', 'An entire process in one headline.', 'We have reached the grand promise.'
 ],[
  'I would ask a follow-up.', 'Some specifics would not hurt.', 'Details sold separately. Kidding.', 'Let’s put an actual idea against it.', 'The interesting part is your version.', 'I suspect there is a middle bit.', 'The headline has done its shift.', 'Your question can do the heavy lifting.', 'A little context would help.', 'You are allowed to ask what that means.'
 ]),
 game:variations("I guess that's supposed to impress you.",[
  'Bricks. A paddle. The classics.', 'Very advanced rectangle negotiations.', 'The bricks have had a quiet day.', 'I brought a jetpack to a paddle game.', 'An important research opportunity.', 'So this is the technical showcase.', 'Those rectangles look confident.', 'A perfectly respectable distraction.', 'The paddle has one job.', 'A tiny arcade. Naturally.'
 ],[
  'I will try to look impressed.', 'Apparently I am the spectator.', 'You can improve the atmosphere.', 'I would help, but these are decorative hands.', 'Somebody should test their confidence.', 'No need to call it productivity.', 'The bubbles are not part of the scoring.', 'I refuse to wear a referee shirt.', 'Let’s not pretend this is a meeting.', 'At least nobody added a tutorial novel.'
 ]),
 design:variations('Pretty colors. Very persuasive little things.',[
  'A new palette. Same basic idea.', 'The layout is trying on an outfit.', 'A little visual diplomacy.', 'The colors would like your attention.', 'Design is being very composed.', 'Look at those well-behaved margins.', 'This is the polished corner.', 'A remarkably calm arrangement.', 'The spacing is doing its thing.', 'A tiny wardrobe for a website.'
 ],[
  'Try making it change its mind.', 'I am resisting the urge to rearrange it.', 'The other buttons have opinions too.', 'That is how they get you.', 'I respect the commitment to looking calm.', 'The bubbles remain off-brand. Probably.', 'A different layout might start an argument.', 'Nothing here has to be your favorite.', 'You can poke it. That is the point.', 'I would have added a jetpack.'
 ]),
 chat:variations('I need to know more!',[
  'Tell me what you have in mind.', 'You have my attention.', 'An unfinished idea is welcome.', 'Start wherever it makes sense to you.', 'I would like to hear your version.', 'A small detail is a good start.', 'You do not need a polished pitch.', 'We can explore this together.', 'Your question belongs here.', 'There is room for the messy version.'
 ],[
  'What would you like to make possible?', 'Plain language is perfect.', 'What would make it useful to you?', 'You can take your time.', 'A sentence is enough to begin.', 'What should feel easier?', 'Tell me the part you care about.', 'We can sort out the shape as we go.', 'Start with the problem, if that helps.', 'I am here for the details.'
 ]),
 general:variations('Tiny jetpack. Unreasonable confidence.',[
  'The bubbles are doing the heavy lifting.', 'A small course correction.', 'Just checking the surroundings.', 'This is my thinking hover.', 'I have located another place to float.', 'The jetpack is making a point.', 'Still here. Still airborne.', 'Curiosity is keeping me busy.', 'A very small dramatic entrance.', 'I am supervising the atmosphere.'
 ],[
  'Someone has to.', 'Do not tell the layout.', 'I call that initiative.', 'Very professional, obviously.', 'The job description was vague.', 'There was no rule against it.', 'I stand by the bubbles.', 'A little personality never hurt.', 'No clipboard required.', 'I am trying not to make a speech.'
 ]),
 tickle:['Hey! Personal airspace.','Ticklish. Extremely dignified about it.','You almost caught a bubble.','Careful. That is my hovering space.'],
 idle:['An unfinished idea is welcome here.','You can start with the messy version.','What would you like to make possible?','A question is a perfectly good starting point.'],
 thinking:['Working through that here in your browser.','A little thinking time. A few more bubbles.','Keeping the conversation local.','Giving that a moment of attention.'],
 reply:['We can keep exploring from here.','There is room for another question.','You can steer the conversation.','The next detail is up to you.']
});
export function createPetDialogue(random=Math.random){
 const recent=[],visited=new Set();
 return context=>{const key=PHRASES[context]?context:'general',pool=PHRASES[key];let line;if(!visited.has(key)){line=pool[0];visited.add(key);}else{const fresh=pool.filter(s=>!recent.includes(s));const options=fresh.length?fresh:pool.filter(s=>s!==recent.at(-1));line=options[Math.min(options.length-1,Math.floor(random()*options.length))];}recent.push(line);if(recent.length>6)recent.shift();return line;};
}
