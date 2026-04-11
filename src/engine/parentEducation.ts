/**
 * Parent Education Module — when a threat is detected, provides
 * evidence-based guidance on how to talk to the child about it.
 *
 * Non-alarmist. Focused on connection, not panic.
 * Includes Danish-specific resources (Borns Vilkar, Red Barnet, etc.)
 */

import { ThreatCategory } from './riskEngine';

// ── INTERFACES ──────────────────────────────────────────────

export interface ParentGuidance {
  title: string;
  whatHappened: string;
  whatItMeans: string;
  howToTalkAboutIt: string[];
  whatNotToDo: string[];
  resources: string[];
  danishResources: string[];
}

// ── GUIDANCE DATABASE ───────────────────────────────────────

const GUIDANCE: Record<ThreatCategory, ParentGuidance> = {
  grooming: {
    title: 'Potential Grooming Detected',
    whatHappened:
      'Custorian detected language patterns consistent with online grooming — ' +
      'an adult building trust with a child to exploit them. This may include ' +
      'flattery, secrecy requests, personal questions, gift offers, or attempts ' +
      'to move the conversation to a private platform.',
    whatItMeans:
      'Grooming is a deliberate process, not a single event. The person may be ' +
      'testing boundaries, isolating your child from trusted adults, or building ' +
      'emotional dependency. Early detection is key — most grooming follows a ' +
      'predictable pattern that escalates over days or weeks. Your child is not ' +
      'at fault. Groomers are skilled manipulators who target vulnerability.',
    howToTalkAboutIt: [
      'You could say: "I noticed something in your messages that I want to talk about. You are not in trouble — I just want to make sure you are safe."',
      'You could say: "Has anyone online asked you to keep something secret from me? That is actually a warning sign that they are not a safe person."',
      'You could say: "Sometimes adults pretend to be younger online, or they say really nice things to get kids to trust them. Has anyone done that?"',
      'You could say: "If someone ever makes you feel uncomfortable or asks for photos, you can always tell me. I will not take your phone away — I will help you handle it."',
      'Ask open-ended questions: "Tell me about the people you talk to online" rather than "Are you talking to strangers?"',
      'Validate their feelings: "I understand this person may have seemed really nice. That is exactly how grooming works — it feels good at first."',
    ],
    whatNotToDo: [
      'Do NOT immediately confiscate their device — this teaches them to hide things rather than come to you.',
      'Do NOT blame your child. Grooming is designed to make the child feel responsible.',
      'Do NOT confront the suspected groomer yourself — report to authorities first.',
      'Do NOT panic visibly. Your child needs to see that you can handle this calmly.',
      'Do NOT interrogate. A calm conversation gets more truth than rapid-fire questions.',
      'Do NOT share screenshots on social media — this can interfere with investigations and re-traumatize your child.',
    ],
    resources: [
      'NCMEC CyberTipline (report): https://report.cybertip.org',
      'Internet Watch Foundation: https://www.iwf.org.uk',
      'Thorn — Digital Defenders of Children: https://www.thorn.org',
      'NetSmartz (age-appropriate safety lessons): https://www.netsmartz.org',
      'Childline (UK): https://www.childline.org.uk — 0800 1111',
    ],
    danishResources: [
      'Borns Vilkar (Children\'s Conditions) — free counseling for children: https://bornsvilkar.dk — Ring 116 111',
      'ForaeldreTelefonen (Parent Helpline): https://bornsvilkar.dk/telefonerne/foraeldre — Ring 35 55 55 57',
      'Red Barnet (Save the Children Denmark): https://redbarnet.dk',
      'Slet Det (Delete It) — help for youth with shared intimate images: https://telefonerne.bornsvilkar.dk/sletdet',
      'Politiet (Danish Police) online crime report: https://politi.dk/anmeld',
      'Center for Digital Paedagogik: https://markup.dk',
    ],
  },

  bullying: {
    title: 'Cyberbullying Detected',
    whatHappened:
      'Custorian detected language consistent with online bullying — direct insults, ' +
      'social exclusion threats, intimidation, or repeated hostile messages targeting ' +
      'your child.',
    whatItMeans:
      'Cyberbullying differs from face-to-face bullying because it follows the child ' +
      'home. There is no safe space when the harassment lives on their phone. Research ' +
      'shows cyberbullying is linked to anxiety, depression, sleep problems, and in ' +
      'severe cases, self-harm. The impact is real even if the words are "just online." ' +
      'Your child may feel ashamed or afraid that reporting it will make things worse.',
    howToTalkAboutIt: [
      'You could say: "I saw some messages that worried me. How are you feeling about what is happening?"',
      'You could say: "Being treated like that is not okay, and it is not your fault. No one deserves to be spoken to that way."',
      'You could say: "I am glad I know about this now, because together we can figure out what to do."',
      'You could say: "Has this been going on for a while? Sometimes kids do not tell their parents because they are worried it will get worse."',
      'You could say: "What would you like to happen? I want to help in a way that feels right to you."',
      'Listen more than you speak. Resist the urge to immediately "fix" — your child needs to feel heard first.',
    ],
    whatNotToDo: [
      'Do NOT say "just ignore it" or "kids will be kids." This dismisses their experience.',
      'Do NOT contact the bully or their parents without a plan — this can escalate.',
      'Do NOT take away their phone as a first response. They may see it as punishment for being bullied.',
      'Do NOT force them to confront the bully if they are not ready.',
      'Do NOT read all their messages in front of them — this feels like a violation even when you mean well.',
      'Do NOT post about the situation on social media.',
    ],
    resources: [
      'StopBullying.gov: https://www.stopbullying.gov',
      'Cybersmile Foundation: https://www.cybersmile.org',
      'Kind Campaign: https://www.kindcampaign.com',
      'Crisis Text Line (US): Text HOME to 741741',
      'Childnet International: https://www.childnet.com',
    ],
    danishResources: [
      'Borns Vilkar — BorneTelefonen (Children\'s Helpline): Ring 116 111 — also chat at https://bornsvilkar.dk',
      'ForaeldreTelefonen (Parent Helpline): Ring 35 55 55 57',
      'Red Barnet (Save the Children Denmark) — anti-bullying programs: https://redbarnet.dk',
      'Mobbeland (anti-bullying resources): https://dcum.dk',
      'Mary Fonden — anti-mobning: https://maryfonden.dk',
      'Skole (school) — Danish law requires schools to act on bullying. Contact the klasselaerer or skoleleder.',
    ],
  },

  selfHarm: {
    title: 'Self-Harm or Suicidal Content Detected',
    whatHappened:
      'Custorian detected language that may indicate self-harm ideation, suicidal ' +
      'thoughts, or engagement with self-harm content. This could be your child ' +
      'expressing distress, searching for harmful methods, or communicating with ' +
      'someone about self-harm.',
    whatItMeans:
      'This is the most serious alert Custorian can raise. Self-harm and suicidal ' +
      'ideation in young people are more common than most parents realize — ' +
      'approximately 1 in 5 adolescents has engaged in some form of self-harm. ' +
      'It is almost always a sign of emotional pain, not attention-seeking. ' +
      'Your response right now matters enormously. The fact that you are seeing this ' +
      'alert is an opportunity to intervene early.',
    howToTalkAboutIt: [
      'You could say: "I love you and I have noticed you might be going through something really hard. Can we talk about it?"',
      'You could say: "I am not angry and you are not in trouble. I am worried because I care about you."',
      'You could say: "Have you been having thoughts about hurting yourself? It is okay to tell me the truth." (Research shows asking directly does NOT increase risk.)',
      'You could say: "Whatever you are feeling right now, it will not always feel this way. And I am here to help you through it."',
      'You could say: "Would you be open to talking to someone who really understands what you are going through? A counselor, not because something is wrong with you, but because everyone deserves support."',
      'If they deny it, do not force it. Say: "Okay. But I want you to know the door is always open. If you ever feel bad, please come to me."',
    ],
    whatNotToDo: [
      'Do NOT panic, yell, or cry in front of them (process your own emotions separately).',
      'Do NOT say "you have nothing to be sad about" or "think about how this affects me."',
      'Do NOT make them promise not to do it — promises do not address the underlying pain.',
      'Do NOT leave them alone if you believe there is immediate risk. Stay calm and stay with them.',
      'Do NOT punish them for self-harm. Punishment drives it underground.',
      'Do NOT search for physical evidence (scars, cuts) without their knowledge — this destroys trust.',
      'Do NOT wait. If in doubt, contact a professional today.',
    ],
    resources: [
      'National Suicide Prevention Lifeline (US): 988 (call or text)',
      'Crisis Text Line (US): Text HOME to 741741',
      'International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres',
      'Self-Injury Outreach & Support: https://sioutreach.org',
      'To Write Love on Her Arms: https://twloha.com',
      'The Trevor Project (LGBTQ+ youth): https://www.thetrevorproject.org — 1-866-488-7386',
    ],
    danishResources: [
      'Livslinien (Lifeline Denmark) — 24/7 crisis support: Ring 70 201 201 — https://livslinien.dk',
      'Borns Vilkar — BorneTelefonen: Ring 116 111 (free, anonymous, for children)',
      'ForaeldreTelefonen (Parent Helpline): Ring 35 55 55 57',
      'Headspace Denmark — youth mental health: https://headspace.dk',
      'PsykInfo — free psychiatric information: https://psykinfo.dk',
      'Boernepsykiatrisk afdeling — contact your region\'s child psychiatric department through your laege (GP)',
      'Red Barnet raadgivning: https://redbarnet.dk',
    ],
  },

  violence: {
    title: 'Violent Threats or Content Detected',
    whatHappened:
      'Custorian detected language involving threats of physical violence, weapon ' +
      'references, planning language, or content that glorifies violence. This may be ' +
      'your child receiving threats, making threats, or engaging with violent content.',
    whatItMeans:
      'Context matters here. Young people sometimes use hyperbolic violent language in ' +
      'gaming or joking contexts ("I will destroy you" in Fortnite). However, specific ' +
      'threats naming targets, methods, or dates are always serious. If your child is ' +
      'receiving threats, they may be afraid to tell you. If they are making threats, ' +
      'it may signal they are in crisis themselves. Either way, this requires your attention.',
    howToTalkAboutIt: [
      'You could say: "I came across something that concerned me. Can you help me understand what is going on?"',
      'You could say: "Is someone threatening you? You are safe to tell me, and I will handle it carefully."',
      'If your child made the threat: "I saw something you wrote that worried me. Were you serious, or were you venting? Either way, I want to understand what you are feeling."',
      'You could say: "Even if it was a joke, threats can be taken seriously by schools and police. Let us talk about what is behind it."',
      'You could say: "Is there a situation at school or online where you feel unsafe or really angry?"',
      'If related to violent content: "I noticed you have been watching/reading some intense stuff. What draws you to it?"',
    ],
    whatNotToDo: [
      'Do NOT ignore specific threats — even if your child says "it was just a joke."',
      'Do NOT overreact to normal gaming language. "I killed you" in Fortnite is not a threat.',
      'Do NOT immediately call the other child\'s parents if your child is being threatened — involve the school first.',
      'Do NOT shame your child if they expressed violent feelings. Shame pushes them away from help.',
      'Do NOT assume the worst, but do NOT assume the best either. Investigate calmly.',
      'Do NOT delay reporting if you believe there is a credible threat to anyone\'s safety.',
    ],
    resources: [
      'Sandy Hook Promise — Know the Signs: https://www.sandyhookpromise.org',
      'National Threat Assessment Center (US Secret Service): https://www.secretservice.gov/protection/ntac',
      'Stomp Out Bullying: https://www.stompoutbullying.org',
      'Crisis Text Line (US): Text HOME to 741741',
      'FBI Tips (credible threats): https://tips.fbi.gov',
    ],
    danishResources: [
      'Politiet (Danish Police) — report threats: Ring 114 (non-emergency) or 112 (emergency)',
      'Borns Vilkar — BorneTelefonen: Ring 116 111',
      'ForaeldreTelefonen: Ring 35 55 55 57',
      'SSP-samarbejdet — contact your kommune\'s SSP team (School-Social services-Police collaboration)',
      'Red Barnet — guidance on children and violence: https://redbarnet.dk',
      'Dit barns skole — Danish schools have a duty to act on threats. Contact klasselaerer or skoleleder immediately.',
    ],
  },

  contentWellness: {
    title: 'Concerning Content Exposure Detected',
    whatHappened:
      'Custorian detected engagement with content that may negatively affect your ' +
      'child\'s wellbeing — this could include body image content (pro-anorexia, ' +
      'extreme dieting), dangerous challenges, radicalizing material, social comparison ' +
      'spirals, adult content, gambling, or substance-related content.',
    whatItMeans:
      'Not every exposure is a crisis, but patterns matter. Algorithms on TikTok, ' +
      'Instagram, and YouTube are designed to feed more of what a child engages with. ' +
      'A single view of body image content can trigger an algorithmic rabbit hole of ' +
      'increasingly extreme material. Children rarely seek this content deliberately — ' +
      'it finds them. Your child is not "broken" for seeing this. The platforms are ' +
      'designed to exploit attention at any cost.',
    howToTalkAboutIt: [
      'You could say: "I want to talk about some of the stuff that comes up on your feeds. Not to judge, just to understand what you are seeing."',
      'You could say: "Did you know that what you see online is chosen by an algorithm that wants to keep you scrolling — not keep you happy?"',
      'For body image: "The people you see online use filters, lighting, editing, and sometimes surgery. I want you to know that what you see is not real, and comparing yourself to it is unfair to you."',
      'For harmful challenges: "Some challenges online are designed to go viral, not to be safe. It is okay to say no, even if everyone else is doing it."',
      'For radicalizing content: "Some people online have very extreme views and they are really good at making them sound logical. What have you been seeing that makes you think?"',
      'You could say: "What accounts or creators do you follow that make you feel good? And are there any that actually make you feel worse after watching?"',
    ],
    whatNotToDo: [
      'Do NOT lecture. Teens tune out lectures within 30 seconds.',
      'Do NOT say "when I was your age" — the digital environment is genuinely different.',
      'Do NOT ban all social media abruptly. This removes their social connection and teaches them to hide usage.',
      'Do NOT body-shame or diet-talk around your child — they absorb your relationship with your own body.',
      'Do NOT assume your child agrees with extreme content they viewed — they may be curious or confused.',
      'Do NOT dismiss their feelings with "it is just the internet." Their online experience is real to them.',
    ],
    resources: [
      'Common Sense Media — age-appropriate content reviews: https://www.commonsensemedia.org',
      'National Eating Disorders Association: https://www.nationaleatingdisorders.org',
      'Internet Matters — digital wellbeing: https://www.internetmatters.org',
      'Center for Humane Technology: https://www.humanetech.com',
      'Wait Until 8th — smartphone readiness: https://www.waituntil8th.org',
    ],
    danishResources: [
      'Borns Vilkar — digital raadgivning: https://bornsvilkar.dk',
      'ForaeldreTelefonen: Ring 35 55 55 57',
      'Red Barnet — boerns digitale liv: https://redbarnet.dk',
      'Center for Digital Paedagogik: https://markup.dk',
      'Medieraadet for Born og Unge (Media Council for Children): https://telefonerne.bornsvilkar.dk',
      'Landsforeningen mod spiseforstyrrelser (eating disorders): https://LMS.dk',
      'Headspace Denmark — free counseling for young people: https://headspace.dk',
    ],
  },
};

// ── PUBLIC API ──────────────────────────────────────────────

/**
 * Get evidence-based parent guidance for a detected threat category.
 * Returns conversation starters, what not to do, and both international
 * and Danish-specific resources.
 */
export function getParentGuidance(category: ThreatCategory): ParentGuidance {
  return GUIDANCE[category];
}

/**
 * Get guidance for all categories at once (useful for reference/education screens).
 */
export function getAllGuidance(): Record<ThreatCategory, ParentGuidance> {
  return { ...GUIDANCE };
}

/**
 * Get just the Danish resources for a category.
 */
export function getDanishResources(category: ThreatCategory): string[] {
  return GUIDANCE[category].danishResources;
}

/**
 * Get emergency contacts based on threat severity.
 * For self-harm / violence, returns immediate crisis lines.
 */
export function getEmergencyContacts(category: ThreatCategory): {
  isEmergency: boolean;
  contacts: string[];
} {
  if (category === 'selfHarm') {
    return {
      isEmergency: true,
      contacts: [
        'Livslinien (Denmark 24/7): 70 201 201',
        'BorneTelefonen: 116 111',
        'Emergency: 112',
        'National Suicide Prevention (US): 988',
      ],
    };
  }

  if (category === 'violence') {
    return {
      isEmergency: true,
      contacts: [
        'Politiet (Danish Police): 112 (emergency) / 114 (non-emergency)',
        'BorneTelefonen: 116 111',
        'ForaeldreTelefonen: 35 55 55 57',
      ],
    };
  }

  return {
    isEmergency: false,
    contacts: [
      'BorneTelefonen: 116 111',
      'ForaeldreTelefonen: 35 55 55 57',
    ],
  };
}
