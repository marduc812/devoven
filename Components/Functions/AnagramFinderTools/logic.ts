// Standard Scrabble letter values for scoring
export const LETTER_VALUES: Record<string, number> = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8,
  K: 5, L: 1, M: 3, N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1,
  U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10,
};

export function scrabbleScore(word: string): number {
  let score = 0;
  for (const ch of word.toUpperCase()) {
    score += LETTER_VALUES[ch] || 0;
  }
  return score;
}

// A built-in word list of 1000+ common English words
export const WORD_LIST: string[] = [
  'a','ab','ace','act','add','age','ago','aid','aim','air','ale','all','and','ant','any','ape','arc','are','ark',
  'arm','art','ash','ask','ate','awe','axe','aye','bad','bag','ban','bar','bat','bay','bed','bet','big','bit',
  'bow','box','boy','bud','bug','bun','bus','but','buy','cab','can','cap','car','cat','cod','cog','cop','cot',
  'cow','cry','cub','cup','cut','dad','dam','day','den','dew','did','dig','dim','dip','dog','dot','dry','dug',
  'dun','duo','ear','eat','egg','ego','elf','elk','elm','emu','end','era','eve','ewe','eye','fad','fan','far',
  'fat','fee','few','fig','fin','fit','fix','fly','fog','for','fox','fry','fun','fur','gap','gas','gel','gem',
  'get','gig','gnu','god','got','gum','gun','gut','guy','gym','had','ham','has','hat','hay','hem','hen','her',
  'hew','hid','him','hip','his','hit','hog','hop','hot','how','hub','hug','hut','ice','ill','imp','ink','inn',
  'ion','ire','ivy','jab','jag','jam','jar','jaw','jet','jig','job','jot','joy','jug','jut','keg','kin','kit',
  'lab','lag','lap','law','lay','lea','led','leg','let','lid','lip','lit','log','lot','low','lug','mad','man',
  'map','mar','mat','maw','may','men','met','mob','mod','mop','mow','mud','mug','mum','nab','nag','nap','net',
  'new','nip','nit','nob','nod','nor','not','now','nun','oak','oar','odd','off','oil','old','one','opt','orb',
  'ore','our','out','owe','own','pad','pan','pap','par','pat','paw','pay','pea','peg','pen','pep','pet','pie',
  'pig','pit','ply','pod','pop','pot','pox','pro','pub','pug','pun','pup','pus','put','rag','ram','ran','rap',
  'rat','raw','ray','red','ref','rep','rev','rid','rig','rim','rip','rob','rod','rot','row','rub','rug','rum',
  'run','rut','rye','sac','sad','sag','sap','sat','saw','say','sea','set','sew','shy','sin','sip','sir','sit',
  'six','ski','sky','sly','sob','sod','son','sow','soy','spa','spy','sty','sub','sue','sum','sun','sup','tab',
  'tan','tap','tar','tat','tax','tea','ten','the','thy','tie','tin','tip','toe','too','top','tow','toy','try',
  'tub','tug','two','urn','use','van','vat','vet','via','vie','vim','vow','wad','war','was','wax','way','web',
  'wed','wig','win','wit','woe','wok','won','woo','wry','yam','yap','yew','you','yow','zap','zen','zig','zip',
  'zone','zoom','zest','zero','yard','yore','your','year','yell','worn','wool','wood','word','work','worm',
  'able','acid','aged','also','alto','arch','area','army','atom','away','back','bail','bake','ball','balm',
  'band','bane','bank','bare','bark','barn','base','bash','bath','bead','beak','beam','bean','bear','beat',
  'been','beer','bell','belt','bend','best','bile','bill','bind','bird','bite','blew','blow','blue','boat',
  'body','bold','bolt','bond','bone','book','boom','boot','bore','born','both','bull','burn','call','calm',
  'came','camp','card','care','case','cast','cave','cell','cent','chad','chat','chef','chip','city','clad',
  'clam','clap','claw','clay','clew','clip','club','clue','coal','coat','code','coil','coin','cold','cole',
  'coma','come','cone','cook','cool','cope','cord','core','cork','corn','cost','coup','crew','crop','crow',
  'cube','curl','dare','dark','dart','data','date','dawn','dead','deal','dean','dear','deck','deep','deer',
  'dent','desk','dial','diet','dirt','disc','dish','disk','dive','dock','does','doll','dome','done','door',
  'dose','down','draw','drew','drip','drop','drum','dual','dull','dump','dusk','dust','duty','each','earl',
  'earn','east','easy','edge','else','emit','epic','even','ever','evil','exam','face','fact','fail','fair',
  'fake','fall','fame','fast','fate','fell','felt','fern','file','fill','film','find','fine','fire','firm',
  'fish','fist','flag','flat','flaw','flea','fled','flew','flex','flit','flock','flog','flow','foam','fold',
  'folk','fond','font','foot','ford','fore','fork','form','fort','foul','four','free','from','full','fume',
  'fuse','gain','gale','game','gave','gaze','gear','gift','gill','give','glad','glee','glen','glow','glue',
  'goad','goal','goat','gold','golf','gone','good','gore','gown','grab','grew','grid','grim','grin','grip',
  'grit','grow','gulf','gush','gust','hack','hail','hair','hale','half','hall','halt','hand','hang','hard',
  'hare','harm','harp','hate','haul','have','hawk','head','heal','heap','hear','heat','heel','held','help',
  'herb','here','hide','high','hill','hint','hire','hold','hole','home','hood','hook','hope','horn','hose',
  'host','hour','hung','hunt','hurl','hymn','idea','idle','inch','into','iron','isle','itch','item','jack',
  'jade','jail','jest','join','joke','jump','junk','jury','just','keen','keep','kick','kill','kind','king',
  'knee','knew','knit','knob','know','lace','lain','lake','lamb','lamp','land','lane','last','late','laud',
  'lava','lawn','lazy','lead','leaf','lean','leap','left','lend','lens','less','lick','life','lift','like',
  'lime','line','link','lion','list','live','load','loam','loan','lock','loft','lone','long','look','loom',
  'lore','lorn','loss','loud','love','luck','lull','lump','lung','lurk','lust','mace','made','mail','main',
  'make','male','mane','mark','mars','mash','mask','mass','mast','mate','maze','meal','mean','meat','melt',
  'memo','mere','mesh','mess','mild','mile','milk','mill','mind','mine','mint','mist','mode','mole','monk',
  'moon','moor','more','most','moth','move','much','mule','myth','nail','name','navy','near','neck','need',
  'nest','news','next','nice','nine','node','none','noon','nose','note','noun','nude','null','numb','once',
  'only','open','oral','oval','over','pace','page','paid','pain','pair','pale','palm','pane','park','part',
  'pass','past','path','peak','peal','pear','peel','peer','pile','pill','pine','pink','pint','pipe','plan',
  'play','plea','plop','plot','plow','ploy','plum','poem','poet','pole','poll','polo','pond','pork','port',
  'pose','post','pour','pray','prey','prim','prod','prop','prow','pull','pump','pure','push','rage','raid',
  'rail','rain','rake','rank','rate','read','real','reap','rear','rely','rent','rest','rich','ride','ring',
  'riot','rise','risk','road','roam','roar','robe','rock','role','roll','roof','room','root','rope','rose',
  'robe','ruin','rule','rush','rust','sack','safe','sage','sake','sale','salt','same','sand','sane','sang',
  'sank','save','scan','scar','seal','seam','seat','seed','seek','self','sell','send','sent','shed','shin',
  'ship','shoe','shop','shot','show','shut','sick','side','sign','silk','sill','sing','sink','site','size',
  'skill','skin','skip','slab','slam','slap','slat','slay','slid','slim','slip','slob','slop','slot','slow',
  'slug','smug','snap','snow','soap','sock','soil','sold','sole','some','song','soot','sort','soul','soup',
  'sour','sown','span','spar','spin','spit','spot','spur','stab','star','stay','stem','step','stew','stir',
  'stop','stub','such','suit','sure','surf','swam','swap','swat','sway','swum','sync','tail','tale','talk',
  'tall','tame','tang','task','tear','teem','tell','tend','tent','term','test','than','that','them','then',
  'they','thin','this','thorn','thus','tide','till','tilt','time','tiny','tire','toad','toil','told','toll',
  'tomb','tome','tone','took','tool','torn','toss','tour','town','trap','tree','trim','trip','true','tuck',
  'tune','turf','turn','tusk','twin','type','ugly','unit','upon','used','user','vale','vary','vast','veil',
  'vein','vest','view','vine','void','volt','vote','wade','wage','wake','walk','wall','wand','wane','want',
  'ward','warm','warn','wart','wash','wave','weak','weal','wean','weep','weld','well','went','were','west',
  'what','when','whim','whip','whom','wick','wide','wife','wild','will','wilt','wind','wine','wing','wink',
  'wire','wise','wish','with','woke','wolf','wont','wore','wrap','wren','wring','writ','yawn','yelp','yoga',
  'yolk','afoot','about','above','acute','admit','adobe','adopt','adore','agent','agile','agree','ahead',
  'alarm','album','alert','algae','alien','align','alike','aloft','alone','along','aloof','aloud','alter',
  'angel','angle','angry','annex','apart','apple','apply','apron','aptly','arbor','arise','arose','array',
  'assay','asset','atlas','atone','attic','audio','audit','avoid','aware','awful','baked','bases','basic',
  'batch','beach','bench','beset','black','blade','blame','blank','blast','blaze','bleed','blend','bless',
  'blind','blink','block','blood','bloom','blown','blues','blunt','blush','board','boggy','bonus','boost',
  'brace','braid','brain','brake','brand','brave','brawl','bread','break','breed','brick','bride','brief',
  'brine','brink','broad','broke','brood','brook','brown','brush','build','built','bulge','bunch','bushy',
  'cache','camel','candy','cargo','carry','catch','cause','chain','chair','chalk','chaos','charm','chart',
  'chase','cheap','check','cheek','cheer','chess','chick','chief','child','chime','chips','choir','chose',
  'chunk','circa','civic','civil','claim','clash','class','clean','clear','clerk','click','cliff','climb',
  'cling','clock','close','cloud','coach','coast','color','comic','comma','coral','count','court','cover',
  'covet','crack','craft','crane','crash','craze','crazy','creak','cream','creek','crime','crimp','crisp',
  'cross','crowd','crush','crust','crypt','cubic','curve','daily','dance','dazed','debut','decay','decoy',
  'delta','dense','depot','depth','derby','digit','dirty','ditty','dizzy','dodge','doing','drink','drift',
  'drive','drove','dryer','eager','early','earth','eight','elect','elite','empty','enemy','enjoy','enter',
  'entry','equal','error','essay','event','every','exact','exist','exult','fable','faith','false','fancy',
  'fault','feast','fence','ferry','fever','field','fifth','fifty','fight','final','first','fixed','flame',
  'flash','flesh','float','flood','floor','floss','flour','flute','flyer','focus','force','forge','forth',
  'found','frame','frank','fraud','fresh','front','frost','frown','froze','fruit','fully','funny','fuzzy',
  'ghost','giant','given','glass','glint','gloss','glove','going','grace','grade','grain','grasp','grass',
  'grate','grave','great','green','greet','grief','grill','groan','grope','gross','group','grove','guard',
  'guess','guest','guide','guild','guile','guilt','guise','gusto','gypsy','habit','happy','harsh','haste',
  'haven','heart','heavy','hence','hinge','horse','hotel','house','human','humid','humor','hurry','image',
  'imply','imply','infer','inner','input','inter','irony','issue','ivory','jaunt','jewel','jiffy','joist',
  'joust','judge','juice','juicy','juror','kayak','knack','kneel','knife','knock','known','label','laden',
  'large','laser','later','laugh','layer','learn','lease','least','leave','ledge','legal','lemon','level',
  'light','limit','linen','liver','lodge','logic','loose','lower','loyal','lucid','lucky','lunar','lying',
  'magic','major','maple','match','maxim','mayor','media','merit','metal','might','mirth','miser','model',
  'mourn','muddy','musty','naive','nerve','never','noble','noise','north','noted','novel','nymph','occur',
  'ocean','offer','often','olive','onset','order','other','ought','outer','oxide','ozone','paint','panel',
  'panic','paper','patch','pause','peace','pedal','penny','phase','phone','photo','piano','piece','pilot',
  'pinch','pixel','pizza','place','plain','plaid','plane','plant','plate','plaza','plead','plume','plunk',
  'point','poise','polar','poker','poppy','posit','pound','power','press','price','pride','prime','print',
  'prior','prize','probe','prone','proof','prose','proud','prove','prowl','prune','psalm','puffy','pulse',
  'purse','qualm','queen','query','quest','queue','quick','quiet','quota','quote','rabbi','radar','rainy',
  'rally','ranch','rapid','ratio','razor','reach','ready','rebel','recap','reign','relax','repay','reply',
  'rider','rifle','right','rigid','risky','rivet','robin','robot','rocky','rouge','rough','round','route',
  'royal','rugby','ruler','rusty','sadly','saint','sandy','sauce','savor','scene','scone','scoop','score',
  'scout','serve','seven','sever','shall','shame','shape','share','sharp','shear','sheep','sheer','shelf',
  'shell','shift','shirt','shock','shore','shout','siege','since','sixth','sixty','sized','skirt','skull',
  'slant','slate','sleep','sleet','slice','slope','sloth','smart','smell','smile','smite','smoke','snare',
  'sneak','solar','solid','solve','sorry','south','space','spare','spark','speak','spear','speed','spend',
  'spice','spill','spite','speak','split','spoke','spree','sprig','squad','squat','squid','staff','stage',
  'stain','stale','stalk','stamp','stand','stark','start','state','stave','steal','steam','steel','steep',
  'steer','stick','stiff','still','stock','stomp','stone','stood','store','storm','story','stout','stove',
  'strap','straw','stray','strep','strip','strop','stuck','study','stump','stung','stunk','stunt','style',
  'sugar','sunny','super','surge','swamp','swear','sweep','sweet','swept','swift','swirl','sword','swore',
  'sworn','swung','syrup','tabby','table','taffy','tapir','tardy','taste','teach','teeth','tempo','tense',
  'terra','testy','thank','their','there','thick','thing','think','third','those','three','threw','throw',
  'thump','tight','timer','tipsy','tiresome','today','token','tonal','topic','total','touch','tough','towel',
  'toxic','trace','track','trade','trail','train','trait','tramp','trash','trawl','treat','trend','trial',
  'trick','tried','tiger','troop','trove','truce','truck','truly','trump','trunk','trust','truth','tulip',
  'tuner','tweak','twice','twirl','twist','tying','ultra','uncle','under','undue','union','unity','until',
  'upper','upset','urban','usher','usual','utter','valid','value','valve','vapor','video','vigor','viral',
  'virus','visit','visor','vista','vital','vivid','vogue','voice','voila','voter','vouch','vowel','wagon',
  'waist','waive','waltz','waste','watch','water','weary','weave','weigh','weird','wheat','wheel','where',
  'while','white','whole','whose','widen','witch','witty','woman','women','world','worry','worse','worst',
  'worth','would','wound','wrath','write','wrong','wrote','wryly','yacht','yearn','yield','young','youth',
];

function sortLetters(s: string): string {
  return s.toLowerCase().split('').sort().join('');
}

function canForm(letters: string, word: string): boolean {
  const available: Record<string, number> = {};
  for (const ch of letters) {
    available[ch] = (available[ch] || 0) + 1;
  }
  for (const ch of word.toLowerCase()) {
    if (!available[ch]) return false;
    available[ch]--;
  }
  return true;
}

export interface AnagramResult {
  exact: string[];
  partial: Record<number, string[]>;
  totalFound: number;
}

export function findAnagrams(letters: string): AnagramResult {
  const clean = letters.toLowerCase().replace(/[^a-z]/g, '');
  if (clean.length === 0) {
    return { exact: [], partial: {}, totalFound: 0 };
  }

  const sortedInput = sortLetters(clean);
  const exact: string[] = [];
  const partial: Record<number, string[]> = {};

  for (const word of WORD_LIST) {
    const w = word.toLowerCase();
    // Exact anagram: uses exactly the same letters
    if (w.length === clean.length && sortLetters(w) === sortedInput) {
      exact.push(w);
    } else if (w.length >= 2 && w.length < clean.length && canForm(clean, w)) {
      // Partial: uses a subset
      if (!partial[w.length]) partial[w.length] = [];
      partial[w.length].push(w);
    }
  }

  // Sort exact by scrabble score descending
  exact.sort((a, b) => scrabbleScore(b) - scrabbleScore(a));

  // Sort partial by scrabble score descending within each length group
  for (const len of Object.keys(partial)) {
    partial[Number(len)].sort((a, b) => scrabbleScore(b) - scrabbleScore(a));
  }

  const totalFound = exact.length + Object.values(partial).reduce((s, arr) => s + arr.length, 0);
  return { exact, partial, totalFound };
}

export interface ScoredWord {
  word: string;
  score: number;
}

export interface RackTile {
  letter: string;
  count: number;
  /** Scrabble value of a single tile of this letter. */
  value: number;
}

export interface AnagramReport {
  /** Lowercase a–z only. */
  letters: string;
  /** Characters that were thrown away, so an input of digits does not silently do nothing. */
  ignored: string[];
  rack: RackTile[];
  /** Scrabble value of the whole rack, which is the ceiling on any word's score. */
  rackScore: number;
  exact: ScoredWord[];
  /** Subsets grouped by word length, longest first. */
  byLength: { length: number; words: ScoredWord[] }[];
  totalFound: number;
  /** Highest-scoring word found, exact or partial. */
  best: ScoredWord | null;
  longest: ScoredWord | null;
  dictionarySize: number;
  /** Word lengths the built-in list actually contains, ascending. An input whose length
   *  is missing from this set can never have an exact anagram here. */
  dictionaryLengths: number[];
}

function score(word: string): ScoredWord {
  return { word, score: scrabbleScore(word) };
}

export function analyzeAnagrams(letters: string): AnagramReport {
  const clean = letters.toLowerCase().replace(/[^a-z]/g, '');
  const ignored = Array.from(
    new Set(letters.split('').filter(c => c.trim() !== '' && !/[a-zA-Z]/.test(c)))
  );

  const counts = new Map<string, number>();
  for (const ch of clean) counts.set(ch, (counts.get(ch) ?? 0) + 1);
  const rack: RackTile[] = Array.from(counts.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([letter, count]) => ({ letter, count, value: LETTER_VALUES[letter.toUpperCase()] ?? 0 }));

  const result = findAnagrams(clean);
  const exact = result.exact.map(score);
  const byLength = Object.keys(result.partial)
    .map(Number)
    .sort((a, b) => b - a)
    .map(length => ({ length, words: result.partial[length].map(score) }));

  const every = [...exact, ...byLength.flatMap(g => g.words)];
  const best = every.reduce<ScoredWord | null>(
    (top, w) => (top === null || w.score > top.score ? w : top),
    null
  );
  const longest = every.reduce<ScoredWord | null>(
    (top, w) => (top === null || w.word.length > top.word.length ? w : top),
    null
  );

  return {
    letters: clean,
    ignored,
    rack,
    rackScore: scrabbleScore(clean),
    exact,
    byLength,
    totalFound: result.totalFound,
    best,
    longest,
    dictionarySize: WORD_LIST.length,
    dictionaryLengths: Array.from(new Set(WORD_LIST.map(w => w.length))).sort((a, b) => a - b),
  };
}
