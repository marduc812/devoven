export interface HomophonePair {
  words: string[];
  explanation: string;
}

export const HOMOPHONE_PAIRS: HomophonePair[] = [
  { words: ['their', 'there', "they're"], explanation: "'their' = belonging to them | 'there' = a place | 'they're' = they are" },
  { words: ['your', "you're"], explanation: "'your' = belonging to you | 'you're' = you are" },
  { words: ['its', "it's"], explanation: "'its' = belonging to it | 'it\\'s' = it is / it has" },
  { words: ['affect', 'effect'], explanation: "'affect' = to influence (verb) | 'effect' = a result (noun)" },
  { words: ['then', 'than'], explanation: "'then' = at that time / next | 'than' = used in comparisons" },
  { words: ['to', 'too', 'two'], explanation: "'to' = preposition/infinitive | 'too' = also / excessively | 'two' = the number 2" },
  { words: ['accept', 'except'], explanation: "'accept' = to receive/agree | 'except' = excluding" },
  { words: ["who's", 'whose'], explanation: "'who\\'s' = who is / who has | 'whose' = belonging to whom" },
  { words: ['lose', 'loose'], explanation: "'lose' = to fail to keep | 'loose' = not tight" },
  { words: ['principle', 'principal'], explanation: "'principle' = a rule/belief | 'principal' = main / school head" },
  { words: ['complement', 'compliment'], explanation: "'complement' = to complete/match | 'compliment' = to praise" },
  { words: ['stationary', 'stationery'], explanation: "'stationary' = not moving | 'stationery' = writing materials" },
  { words: ['further', 'farther'], explanation: "'further' = more (figurative) | 'farther' = more distant (physical)" },
  { words: ['fewer', 'less'], explanation: "'fewer' = countable items | 'less' = uncountable amounts" },
  { words: ['lay', 'lie'], explanation: "'lay' = to place something down | 'lie' = to recline" },
  { words: ['raise', 'rise'], explanation: "'raise' = to lift something | 'rise' = to go up on its own" },
  { words: ['ensure', 'insure', 'assure'], explanation: "'ensure' = to make certain | 'insure' = for insurance | 'assure' = to reassure a person" },
  { words: ['imply', 'infer'], explanation: "'imply' = to suggest (speaker) | 'infer' = to deduce (listener)" },
  { words: ['compose', 'comprise'], explanation: "'compose' = parts make up the whole | 'comprise' = whole consists of parts" },
  { words: ['disinterested', 'uninterested'], explanation: "'disinterested' = impartial | 'uninterested' = not interested" },
  { words: ['historic', 'historical'], explanation: "'historic' = famous/important | 'historical' = relating to history" },
  { words: ['continuous', 'continual'], explanation: "'continuous' = without interruption | 'continual' = recurring repeatedly" },
  { words: ['between', 'among'], explanation: "'between' = two things | 'among' = more than two things" },
  { words: ['beside', 'besides'], explanation: "'beside' = next to | 'besides' = in addition to" },
  { words: ['since', 'because'], explanation: "'since' = from a time (also causal but ambiguous) | 'because' = clear causation" },
  { words: ['while', 'although'], explanation: "'while' = at the same time | 'although' = in spite of the fact" },
  { words: ['that', 'which'], explanation: "'that' = restrictive clause | 'which' = non-restrictive clause (needs comma)" },
  { words: ['who', 'whom'], explanation: "'who' = subject (he/she) | 'whom' = object (him/her)" },
  { words: ['me', 'I'], explanation: "'I' = subject | 'me' = object (use 'between you and me' not 'between you and I')" },
  { words: ['good', 'well'], explanation: "'good' = adjective | 'well' = adverb (you did well, not you did good)" },
  { words: ['bad', 'badly'], explanation: "'bad' = adjective | 'badly' = adverb" },
  { words: ['amount', 'number'], explanation: "'amount' = uncountable | 'number' = countable" },
  { words: ['percent', 'percentage'], explanation: "'percent' = with a number (5 percent) | 'percentage' = without a number" },
  { words: ['data', 'datum'], explanation: "'datum' = singular | 'data' = plural (though 'data is' is now widely accepted)" },
  { words: ['criteria', 'criterion'], explanation: "'criterion' = singular | 'criteria' = plural" },
  { words: ['phenomenon', 'phenomena'], explanation: "'phenomenon' = singular | 'phenomena' = plural" },
  { words: ['media', 'medium'], explanation: "'medium' = singular | 'media' = plural" },
  { words: ['bring', 'take'], explanation: "'bring' = move toward the speaker | 'take' = move away from the speaker" },
  { words: ['lend', 'borrow'], explanation: "'lend' = to give temporarily | 'borrow' = to receive temporarily" },
  { words: ['teach', 'learn'], explanation: "'teach' = to instruct | 'learn' = to acquire knowledge" },
  { words: ['see', 'watch', 'look'], explanation: "'see' = passive perception | 'watch' = active observation of movement | 'look' = directing eyes somewhere" },
  { words: ['hear', 'listen'], explanation: "'hear' = passive perception | 'listen' = active attention" },
  { words: ['speak', 'talk'], explanation: "'speak' = more formal/one-way | 'talk' = more informal/two-way" },
  { words: ['say', 'tell'], explanation: "'say' = report words | 'tell' = inform someone (needs object)" },
  { words: ['do', 'make'], explanation: "'do' = activities/tasks | 'make' = creating/producing" },
  { words: ['house', 'home'], explanation: "'house' = the physical building | 'home' = where you live/belong" },
  { words: ['rob', 'steal'], explanation: "'rob' = take from a person (rob a person) | 'steal' = take an object (steal money)" },
  { words: ['economic', 'economical'], explanation: "'economic' = relating to the economy | 'economical' = saving money/frugal" },
  { words: ['classic', 'classical'], explanation: "'classic' = typical example of excellence | 'classical' = relating to ancient Greece/Rome or classical music" },
  { words: ['sensual', 'sensuous'], explanation: "'sensual' = gratifying the senses especially sexually | 'sensuous' = relating to the senses generally" },
  { words: ['practical', 'practicable'], explanation: "'practical' = useful in practice | 'practicable' = able to be done" },
  { words: ['comprehensible', 'comprehensive'], explanation: "'comprehensible' = able to be understood | 'comprehensive' = complete/thorough" },
  { words: ['aural', 'oral'], explanation: "'aural' = relating to the ear/hearing | 'oral' = relating to the mouth/speaking" },
  { words: ['elicit', 'illicit'], explanation: "'elicit' = to draw out/evoke | 'illicit' = illegal/forbidden" },
  { words: ['eminent', 'imminent', 'immanent'], explanation: "'eminent' = famous/distinguished | 'imminent' = about to happen | 'immanent' = inherent/present throughout" },
  { words: ['flout', 'flaunt'], explanation: "'flout' = to openly disregard a rule | 'flaunt' = to show off ostentatiously" },
  { words: ['forego', 'forgo'], explanation: "'forego' = to go before | 'forgo' = to go without/abstain from" },
  { words: ['flounder', 'founder'], explanation: "'flounder' = to struggle awkwardly | 'founder' = to fail/sink" },
  { words: ['gourmet', 'gourmand'], explanation: "'gourmet' = connoisseur of fine food | 'gourmand' = one who loves to eat (sometimes excessively)" },
  { words: ['hanged', 'hung'], explanation: "'hanged' = executed by hanging (person) | 'hung' = suspended (picture)" },
  { words: ['hardy', 'hearty'], explanation: "'hardy' = robust/able to endure | 'hearty' = enthusiastic/wholesome" },
  { words: ['homogeneous', 'homogenous'], explanation: "'homogeneous' = of the same kind | 'homogenous' = of common descent (biology term)" },
  { words: ['incredible', 'incredulous'], explanation: "'incredible' = hard to believe | 'incredulous' = skeptical/not believing" },
  { words: ['inflammable', 'flammable'], explanation: "Both mean capable of burning — 'inflammable' does NOT mean non-flammable" },
  { words: ['ingenious', 'ingenuous'], explanation: "'ingenious' = clever/inventive | 'ingenuous' = innocent/naive" },
  { words: ['loath', 'loathe'], explanation: "'loath' = reluctant (adjective) | 'loathe' = to detest (verb)" },
  { words: ['luxuriant', 'luxurious'], explanation: "'luxuriant' = rich/lush growth | 'luxurious' = relating to luxury" },
  { words: ['militate', 'mitigate'], explanation: "'militate' = to have force against | 'mitigate' = to lessen severity" },
  { words: ['notable', 'notorious'], explanation: "'notable' = worthy of note/distinguished | 'notorious' = famous for something bad" },
  { words: ['observance', 'observation'], explanation: "'observance' = following a rule/custom | 'observation' = watching/noticing" },
  { words: ['perquisite', 'prerequisite'], explanation: "'perquisite' = a perk/privilege | 'prerequisite' = a prior requirement" },
  { words: ['prescribe', 'proscribe'], explanation: "'prescribe' = to recommend/authorize | 'proscribe' = to forbid/prohibit" },
  { words: ['prevaricate', 'procrastinate'], explanation: "'prevaricate' = to speak evasively | 'procrastinate' = to delay/postpone" },
  { words: ['regretful', 'regrettable'], explanation: "'regretful' = feeling regret (person) | 'regrettable' = causing regret (situation)" },
  { words: ['repress', 'suppress'], explanation: "'repress' = to put down by force | 'suppress' = to keep from being known/felt" },
  { words: ['seasonal', 'seasonable'], explanation: "'seasonal' = relating to a season | 'seasonable' = appropriate for the season" },
  { words: ['tortuous', 'torturous'], explanation: "'tortuous' = winding/complex | 'torturous' = relating to torture/agonizing" },
  { words: ['unexceptional', 'unexceptionable'], explanation: "'unexceptional' = ordinary/not special | 'unexceptionable' = not open to objection" },
  { words: ['venal', 'venial'], explanation: "'venal' = corrupt/bribable | 'venial' = minor/pardonable (sin)" },
  { words: ['weather', 'whether', 'wether'], explanation: "'weather' = atmospheric conditions | 'whether' = if/either-or | 'wether' = a castrated male sheep" },
  { words: ['write', 'right', 'rite', 'wright'], explanation: "'write' = to inscribe | 'right' = correct/direction | 'rite' = a ceremony | 'wright' = a craftsman" },
  { words: ['cite', 'site', 'sight'], explanation: "'cite' = to quote/reference | 'site' = a location | 'sight' = ability to see / a view" },
  { words: ['bare', 'bear'], explanation: "'bare' = uncovered/empty | 'bear' = the animal / to carry/endure" },
  { words: ['fair', 'fare'], explanation: "'fair' = just/light-colored/event | 'fare' = a fee / food / to manage" },
  { words: ['peace', 'piece'], explanation: "'peace' = absence of conflict | 'piece' = a portion" },
  { words: ['week', 'weak'], explanation: "'week' = seven days | 'weak' = not strong" },
  { words: ['break', 'brake'], explanation: "'break' = to shatter / a pause | 'brake' = a stopping device" },
  { words: ['steak', 'stake'], explanation: "'steak' = a cut of meat | 'stake' = a post / something at risk" },
  { words: ['flour', 'flower'], explanation: "'flour' = ground grain | 'flower' = a blossom" },
  { words: ['pair', 'pear', 'pare'], explanation: "'pair' = two matching things | 'pear' = a fruit | 'pare' = to peel/trim" },
  { words: ['pray', 'prey'], explanation: "'pray' = to address a deity | 'prey' = an animal hunted / to hunt" },
  { words: ['principal', 'principle'], explanation: "'principal' = main/leader | 'principle' = a fundamental rule" },
];

export interface ConfusableMatch {
  word: string;
  position: number;
  pair: HomophonePair;
}

function normalizeWord(w: string): string {
  return w.toLowerCase().replace(/[^a-z']/g, '');
}

export function checkText(text: string): ConfusableMatch[] {
  if (!text.trim()) return [];

  const wordRegex = /[\w']+/g;
  const matches: ConfusableMatch[] = [];
  const seen = new Set<string>();

  let m: RegExpExecArray | null;
  while ((m = wordRegex.exec(text)) !== null) {
    const raw = m[0];
    const normalized = normalizeWord(raw);
    const key = `${normalized}-${m.index}`;
    if (seen.has(key)) continue;

    for (const pair of HOMOPHONE_PAIRS) {
      for (const w of pair.words) {
        if (normalizeWord(w) === normalized) {
          seen.add(key);
          matches.push({ word: raw, position: m.index, pair });
          break;
        }
      }
    }
  }

  return matches;
}

export function formatHomophoneOutput(text: string): string {
  if (!text.trim()) return '';

  const matches = checkText(text);
  if (matches.length === 0) {
    return 'No commonly confused words found in the input text.\n\nThe checker looks for 80+ commonly confused word pairs like their/there/they\'re, affect/effect, lose/loose, etc.';
  }

  // Group by pair to avoid repeated explanations
  const byPair = new Map<HomophonePair, ConfusableMatch[]>();
  for (const match of matches) {
    const existing = byPair.get(match.pair);
    if (existing) {
      existing.push(match);
    } else {
      byPair.set(match.pair, [match]);
    }
  }

  const lines: string[] = [];
  lines.push(`Found ${matches.length} potentially confused word(s) in ${byPair.size} group(s):\n`);

  for (const [pair, pairMatches] of byPair) {
    const foundWords = pairMatches.map(m => `"${m.word}" (pos ${m.position})`).join(', ');
    lines.push(`Words found: ${foundWords}`);
    lines.push(`Confused set: ${pair.words.join(' / ')}`);
    lines.push(`Explanation: ${pair.explanation}`);
    lines.push('');
  }

  lines.push('---');
  lines.push('Tip: Review each highlighted word in context to ensure correct usage.');

  return lines.join('\n');
}
