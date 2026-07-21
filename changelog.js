/* ══════════════════════════════════════════════════════════
   CHANGELOG — in-app version history + the app version itself.
   - CHANGELOG is ordered NEWEST FIRST; APP_VERSION is derived from
     the first entry, so adding an entry IS the version bump
     (single source of truth, nothing can drift).
   - Every entry carries its texts in ALL 7 LANGUAGES (en, fr, es,
     zh, it, nl, de) — an entry without the 7 is an incomplete
     change (tests enforce this).
   - Entries are written from the USER's point of view ("You can
     now…"), never developer notes.
   - Versions before 1.0.0 were reconstructed from the git history
     (2026-07-04 → 2026-07-11); the in-app changelog shipped with
     the auto-update mechanism (1.0.0).
   - Release routine: add an entry here (top of the array), then
     bump SW_VERSION in sw.js, `npm run build`, commit, push.
   ══════════════════════════════════════════════════════════ */

export const CHANGELOG = [
  {
    version: '1.11.1',
    date: '2026-07-21',
    changes: {
      en: [
        'Fix: the search field no longer shows a permanent red outline — the red focus ring now appears only when navigating with the keyboard.',
      ],
      fr: [
        'Correctif : le champ de recherche n’affiche plus de contour rouge permanent — l’anneau rouge de focus n’apparaît plus qu’en navigation clavier.',
      ],
      es: [
        'Corrección: el campo de búsqueda ya no muestra un contorno rojo permanente — el anillo rojo de foco solo aparece al navegar con el teclado.',
      ],
      zh: [
        '修复：搜索框不再显示常驻的红色边框——红色焦点圆环现在仅在使用键盘导航时出现。',
      ],
      it: [
        'Correzione: il campo di ricerca non mostra più un contorno rosso permanente — l’anello rosso di focus appare solo navigando con la tastiera.',
      ],
      nl: [
        'Fix: het zoekveld toont geen permanente rode rand meer — de rode focusring verschijnt nu alleen bij toetsenbordnavigatie.',
      ],
      de: [
        'Korrektur: das Suchfeld zeigt keinen dauerhaften roten Rahmen mehr — der rote Fokusring erscheint jetzt nur noch bei Tastaturnavigation.',
      ],
    },
  },
  {
    version: '1.11.0',
    date: '2026-07-18',
    changes: {
      en: [
        'Cards come alive on hover: a soft red glow, a light sweep across the visual and a subtle zoom of the driver number.',
        'Cleaner interactions everywhere: keyboard focus now shows a clear red ring (accessibility), buttons gently press down on click.',
        'Dark theme: cards gain a touch more depth; the team name is easier to read, with a small team-color dot.',
      ],
      fr: [
        'Les cartes s’animent au survol : lueur rouge douce, balayage de lumière sur le visuel et léger zoom du numéro de pilote.',
        'Interactions plus nettes partout : le focus clavier affiche désormais un anneau rouge clair (accessibilité), les boutons s’enfoncent légèrement au clic.',
        'Thème sombre : les cartes gagnent en profondeur ; le nom d’écurie est plus lisible, avec une petite pastille à la couleur de l’équipe.',
      ],
      es: [
        'Las cartas cobran vida al pasar el ratón: brillo rojo suave, barrido de luz en el visual y un sutil zoom del número del piloto.',
        'Interacciones más limpias en todas partes: el foco del teclado muestra ahora un anillo rojo claro (accesibilidad), los botones se hunden ligeramente al hacer clic.',
        'Tema oscuro: las cartas ganan profundidad; el nombre de la escudería se lee mejor, con un pequeño punto del color del equipo.',
      ],
      zh: [
        '悬停时卡牌更生动：柔和的红色光晕、掠过视觉区的光泽以及车手号码的轻微放大。',
        '各处交互更清晰：键盘焦点现在显示醒目的红色圆环（无障碍），按钮点击时轻微下沉。',
        '深色主题：卡牌更有层次感；车队名称更易读，并配有车队配色的小圆点。',
      ],
      it: [
        'Le carte prendono vita al passaggio del mouse: bagliore rosso morbido, spazzata di luce sul visual e un leggero zoom del numero del pilota.',
        'Interazioni più pulite ovunque: il focus da tastiera mostra ora un chiaro anello rosso (accessibilità), i pulsanti si abbassano leggermente al clic.',
        'Tema scuro: le carte guadagnano profondità; il nome della scuderia è più leggibile, con un puntino del colore del team.',
      ],
      nl: [
        'Kaarten komen tot leven bij hover: een zachte rode gloed, een lichtstreep over het visuele deel en een subtiele zoom van het rijdersnummer.',
        'Strakkere interacties overal: toetsenbordfocus toont nu een duidelijke rode ring (toegankelijkheid), knoppen drukken licht in bij het klikken.',
        'Donker thema: kaarten krijgen meer diepte; de teamnaam is beter leesbaar, met een klein bolletje in de teamkleur.',
      ],
      de: [
        'Karten werden beim Überfahren lebendig: ein weiches rotes Leuchten, ein Lichtstreif über das Visual und ein dezenter Zoom der Fahrernummer.',
        'Sauberere Interaktionen überall: der Tastaturfokus zeigt jetzt einen klaren roten Ring (Barrierefreiheit), Knöpfe senken sich beim Klick leicht ab.',
        'Dunkles Thema: Karten bekommen mehr Tiefe; der Teamname ist besser lesbar, mit einem kleinen Punkt in der Teamfarbe.',
      ],
    },
  },
  {
    version: '1.10.1',
    date: '2026-07-17',
    changes: {
      en: [
        'Internal consistency work on the interface styles — nothing changes on screen, everything gets easier to maintain.',
      ],
      fr: [
        'Travail interne de cohérence sur les styles de l’interface — rien ne change à l’écran, tout devient plus simple à maintenir.',
      ],
      es: [
        'Trabajo interno de coherencia en los estilos de la interfaz — nada cambia en pantalla, todo resulta más fácil de mantener.',
      ],
      zh: [
        '界面样式的内部一致性整理——屏幕上没有任何变化，维护起来更轻松。',
      ],
      it: [
        'Lavoro interno di coerenza sugli stili dell’interfaccia — nulla cambia sullo schermo, tutto diventa più semplice da mantenere.',
      ],
      nl: [
        'Intern consistentiewerk aan de interfacestijlen — er verandert niets op het scherm, alles wordt makkelijker te onderhouden.',
      ],
      de: [
        'Interne Konsistenzarbeit an den Oberflächenstilen — auf dem Bildschirm ändert sich nichts, alles wird leichter zu warten.',
      ],
    },
  },
  {
    version: '1.10.0',
    date: '2026-07-13',
    changes: {
      en: [
        'New "Share your feedback" section in Settings: send a suggestion, a bug report or anything else straight to the maintainer — cloud sign-in required (no anonymous spam), with a character counter and a list of what you already sent.',
      ],
      fr: [
        'Nouvelle section « Donner mon avis » dans les Réglages : envoie une suggestion, un bug ou n’importe quoi d’autre directement au mainteneur — connexion cloud requise (pas de spam anonyme), avec compteur de caractères et la liste de ce que tu as déjà envoyé.',
      ],
      es: [
        'Nueva sección «Compartir mi opinión» en Ajustes: envía una sugerencia, un bug o cualquier otra cosa directamente al mantenedor — se requiere la conexión a la nube (sin spam anónimo), con contador de caracteres y la lista de lo ya enviado.',
      ],
      zh: [
        '设置中新增“提交反馈”区域：把建议、问题报告或任何想法直接发给维护者——需要云端登录（杜绝匿名滥发），带字符计数器，还能查看你已发送的内容。',
      ],
      it: [
        'Nuova sezione «Lascia un feedback» nelle Impostazioni: invia un suggerimento, un bug o qualsiasi altra cosa direttamente al manutentore — accesso cloud richiesto (niente spam anonimo), con contatore di caratteri e l’elenco di ciò che hai già inviato.',
      ],
      nl: [
        'Nieuwe sectie “Feedback geven” in Instellingen: stuur een suggestie, een bug of wat dan ook rechtstreeks naar de beheerder — cloudlogin vereist (geen anonieme spam), met tekenteller en een lijst van wat je al verzond.',
      ],
      de: [
        'Neuer Bereich „Feedback geben“ in den Einstellungen: schicke einen Vorschlag, einen Bug oder alles andere direkt an den Betreuer — Cloud-Anmeldung erforderlich (kein anonymer Spam), mit Zeichenzähler und der Liste des bereits Gesendeten.',
      ],
    },
  },
  {
    version: '1.9.1',
    date: '2026-07-13',
    changes: {
      en: [
        'Fixed: adding or removing a copy from a card’s detail view no longer turns the header black — the visual (and the rarity tag) now update instantly and correctly, including back to the base look at zero copies.',
      ],
      fr: [
        'Corrigé : ajouter ou retirer un exemplaire depuis la fiche d’une carte ne rend plus le bandeau noir — le visuel (et la pastille de rareté) se mettent à jour instantanément et correctement, y compris le retour au visuel de base à zéro exemplaire.',
      ],
      es: [
        'Corregido: añadir o quitar un ejemplar desde la ficha de una carta ya no vuelve negra la cabecera — el visual (y la etiqueta de rareza) se actualizan al instante y correctamente, incluido el regreso al aspecto base con cero ejemplares.',
      ],
      zh: [
        '修复：在卡牌详情页添加或移除一张副本不再导致顶部变黑——视觉效果（及稀有度标签）现在会即时正确更新，包括数量归零时恢复基础外观。',
      ],
      it: [
        'Corretto: aggiungere o togliere una copia dalla scheda di una carta non rende più nera la testata — il visual (e l’etichetta di rarità) si aggiornano all’istante e correttamente, incluso il ritorno all’aspetto base a zero copie.',
      ],
      nl: [
        'Opgelost: een exemplaar toevoegen of verwijderen vanuit de detailweergave maakt de kop niet langer zwart — het visuele effect (en het zeldzaamheidslabel) worden nu meteen en correct bijgewerkt, inclusief terugkeer naar de basisweergave bij nul exemplaren.',
      ],
      de: [
        'Behoben: das Hinzufügen oder Entfernen eines Exemplars in der Detailansicht macht den Kopfbereich nicht mehr schwarz — das Visual (und das Seltenheits-Etikett) aktualisieren sich jetzt sofort und korrekt, einschließlich der Rückkehr zum Basis-Look bei null Exemplaren.',
      ],
    },
  },
  {
    version: '1.9.0',
    date: '2026-07-13',
    changes: {
      en: [
        'Nitro Foil, remade: the same four vivid rotating beams as the Wild, a grid that only lights up when the mauve reflection sweeps by, a luminous mauve border with the Wild’s cycling halo — and it now shows above the Wild when you own both.',
        'No more colored edges on any foil card — the golden border stays a promo exclusive.',
      ],
      fr: [
        'Nitro Foil refait : les quatre faisceaux tournants aussi vifs que le Wild, un quadrillage qui ne s’illumine qu’au passage du reflet mauve, un bord mauve lumineux avec le halo cyclant du Wild — et il s’affiche désormais au-dessus du Wild quand tu possèdes les deux.',
        'Plus aucun bord coloré sur les cartes foil — le liseré doré reste l’exclusivité des promos.',
      ],
      es: [
        'Nitro Foil rehecho: los mismos cuatro haces giratorios vivos que el Wild, una cuadrícula que solo se ilumina al paso del reflejo malva, un borde malva luminoso con el halo cíclico del Wild — y ahora se muestra por encima del Wild cuando tienes ambos.',
        'Se acabaron los bordes de color en las cartas foil — el borde dorado sigue siendo exclusivo de las promos.',
      ],
      zh: [
        'Nitro Foil 重制：与 Wild 同样鲜亮的四色旋转光束，网格只在淡紫反光扫过时点亮，淡紫发光描边配以 Wild 的循环光晕——当你同时拥有两者时，现在优先显示 Nitro。',
        '所有箔卡不再有彩色描边——金色描边仍为促销卡专属。',
      ],
      it: [
        'Nitro Foil rifatto: gli stessi quattro fasci rotanti vividi del Wild, una griglia che si illumina solo al passaggio del riflesso malva, un bordo malva luminoso con l’alone ciclico del Wild — e ora appare sopra il Wild quando li possiedi entrambi.',
        'Niente più bordi colorati sulle carte foil — il bordo dorato resta esclusiva delle promo.',
      ],
      nl: [
        'Nitro Foil opnieuw gemaakt: dezelfde vier levendige draaiende lichtbundels als de Wild, een raster dat alleen oplicht wanneer de mauve weerschijn passeert, een lichtgevende mauve rand met de cyclische gloed van de Wild — en hij toont nu boven de Wild wanneer je beide bezit.',
        'Geen gekleurde randen meer op foilkaarten — de gouden rand blijft exclusief voor promo’s.',
      ],
      de: [
        'Nitro Foil neu gemacht: dieselben vier lebendigen rotierenden Strahlen wie beim Wild, ein Raster, das nur aufleuchtet, wenn der mauvefarbene Widerschein vorbeizieht, ein leuchtender mauvefarbener Rand mit dem zyklischen Halo des Wild — und er wird jetzt über dem Wild angezeigt, wenn du beide besitzt.',
        'Keine farbigen Ränder mehr auf Foil-Karten — der goldene Rand bleibt den Promos vorbehalten.',
      ],
    },
  },
  {
    version: '1.8.0',
    date: '2026-07-13',
    changes: {
      en: [
        'Visual polish: no more colored edges on foil cards — the golden border is now a promo-card exclusive and hugs the rounded corners perfectly. The Legendary chip wears a richer golden amber.',
      ],
      fr: [
        'Finitions visuelles : plus de bords colorés sur les cartes foil — le liseré doré est désormais réservé aux cartes promo et épouse parfaitement les coins arrondis. La pastille Légendaire passe à un ambre doré plus riche.',
      ],
      es: [
        'Retoques visuales: se acabaron los bordes de color en las cartas foil — el borde dorado es ahora exclusivo de las promos y abraza perfectamente las esquinas redondeadas. El chip Legendaria luce un ámbar dorado más rico.',
      ],
      zh: [
        '视觉细节打磨：箔卡不再有彩色描边——金色描边现为促销卡专属，并完美贴合圆角。“传奇”标签换上更华丽的金琥珀色。',
      ],
      it: [
        'Rifiniture visive: niente più bordi colorati sulle carte foil — il bordo dorato è ora esclusiva delle promo e abbraccia perfettamente gli angoli arrotondati. Il chip Leggendaria veste un ambra dorata più ricca.',
      ],
      nl: [
        'Visuele afwerking: geen gekleurde randen meer op foilkaarten — de gouden rand is nu exclusief voor promokaarten en volgt de afgeronde hoeken perfect. De Legendarisch-chip draagt een rijker goudamber.',
      ],
      de: [
        'Visueller Feinschliff: keine farbigen Ränder mehr auf Foil-Karten — der goldene Rand ist jetzt exklusiv für Promo-Karten und schmiegt sich perfekt an die abgerundeten Ecken. Der Legendär-Chip trägt ein satteres Goldamber.',
      ],
    },
  },
  {
    version: '1.7.0',
    date: '2026-07-13',
    changes: {
      en: [
        'Foil cards now wear their gradient over the WHOLE card, in one seamless layer — and the text sits on the same translucent dark panel as the Wild Foil, so it stays perfectly readable on every background. Nitro gets the full Wild treatment; plain types keep their neutral body.',
      ],
      fr: [
        'Les cartes foil portent désormais leur dégradé sur TOUTE la carte, en une seule couche sans cassure — et le texte repose sur le même encadré noir translucide que le Wild Foil, parfaitement lisible sur tous les fonds. Le Nitro reçoit le traitement Wild complet ; les types simples gardent leur corps neutre.',
      ],
      es: [
        'Las cartas foil llevan ahora su degradado por TODA la carta, en una sola capa sin cortes — y el texto reposa sobre el mismo panel oscuro translúcido que el Wild Foil, perfectamente legible en cualquier fondo. El Nitro recibe el tratamiento Wild completo; los tipos simples conservan su cuerpo neutro.',
      ],
      zh: [
        '箔卡的渐变现在铺满整张卡牌，浑然一体没有断层——文字置于与 Wild Foil 相同的半透明黑色底板上，在任何背景上都清晰可读。Nitro 获得完整的 Wild 处理；普通类型保持中性卡身。',
      ],
      it: [
        'Le carte foil portano ora il loro gradiente su TUTTA la carta, in un unico strato senza stacchi — e il testo poggia sullo stesso pannello scuro traslucido del Wild Foil, perfettamente leggibile su ogni sfondo. Il Nitro riceve il trattamento Wild completo; i tipi semplici mantengono il corpo neutro.',
      ],
      nl: [
        'Foilkaarten dragen hun verloop nu over de HELE kaart, in één naadloze laag — en de tekst rust op hetzelfde doorschijnende donkere paneel als de Wild Foil, perfect leesbaar op elke achtergrond. Nitro krijgt de volledige Wild-behandeling; gewone types houden hun neutrale romp.',
      ],
      de: [
        'Foil-Karten tragen ihren Verlauf jetzt über die GANZE Karte, in einer nahtlosen Schicht — und der Text ruht auf demselben durchscheinenden dunklen Panel wie die Wild Foil, auf jedem Hintergrund bestens lesbar. Nitro erhält die volle Wild-Behandlung; einfache Typen behalten ihren neutralen Korpus.',
      ],
    },
  },
  {
    version: '1.6.0',
    date: '2026-07-13',
    changes: {
      en: [
        'New "Check for updates" button in Settings → About: look for a new version on demand — if one is online, the usual reload banner takes over; otherwise you get a clear "You are up to date ✓".',
      ],
      fr: [
        'Nouveau bouton « Vérifier les mises à jour » dans Réglages → À propos : cherche une nouvelle version à la demande — s’il y en a une en ligne, le bandeau habituel prend le relais ; sinon un « Tu es à jour ✓ » clair te rassure.',
      ],
      es: [
        'Nuevo botón «Buscar actualizaciones» en Ajustes → Acerca de: busca una nueva versión cuando quieras — si hay una en línea, el aviso habitual toma el relevo; si no, un claro «Estás al día ✓» te tranquiliza.',
      ],
      zh: [
        '设置 → 关于中新增“检查更新”按钮：随时主动查找新版本——如有新版本上线，熟悉的重新加载横幅会接管；否则会明确显示“已是最新版本 ✓”。',
      ],
      it: [
        'Nuovo pulsante «Controlla gli aggiornamenti» in Impostazioni → Informazioni: cerca una nuova versione su richiesta — se ce n’è una online, il consueto banner prende il testimone; altrimenti un chiaro «Sei aggiornato ✓» ti rassicura.',
      ],
      nl: [
        'Nieuwe knop “Controleren op updates” in Instellingen → Over: zoek op aanvraag naar een nieuwe versie — staat er een online, dan neemt de vertrouwde herlaadbanner het over; anders stelt een duidelijke “Je bent up-to-date ✓” je gerust.',
      ],
      de: [
        'Neuer Knopf „Nach Updates suchen“ in Einstellungen → Über: suche auf Wunsch nach einer neuen Version — gibt es eine, übernimmt das gewohnte Neuladen-Banner; andernfalls beruhigt dich ein klares „Du bist auf dem neuesten Stand ✓“.',
      ],
    },
  },
  {
    version: '1.5.0',
    date: '2026-07-13',
    changes: {
      en: [
        'The card detail view is framed cleanly again: close button back in its corner, visual clipped to the rounded frame, and the Wild effect covers the whole header at every angle.',
        'Type visuals now stay in the top area: the card body (name, team, buttons) keeps its neutral background — and the golden border on promos is gone.',
      ],
      fr: [
        'La fiche d’une carte retrouve un cadre impeccable : bouton de fermeture à sa place, visuel bien contenu dans les coins arrondis, et effet Wild qui couvre tout le bandeau sous tous les angles.',
        'Les visuels de type restent désormais dans la zone du haut : le corps de la carte (nom, équipe, boutons) garde son fond neutre — et le liseré doré des promos disparaît.',
      ],
      es: [
        'La ficha de una carta vuelve a estar bien encuadrada: botón de cierre en su sitio, visual contenido en el marco redondeado, y el efecto Wild cubre toda la cabecera en cualquier ángulo.',
        'Los visuales de tipo se quedan ahora en la zona superior: el cuerpo de la carta (nombre, equipo, botones) conserva su fondo neutro — y el borde dorado de las promos desaparece.',
      ],
      zh: [
        '卡牌详情页恢复了整洁的边框：关闭按钮回到角落，视觉效果被圆角框完整裁切，Wild 效果在任何角度都能铺满整个顶部。',
        '类型视觉效果现在只保留在顶部区域：卡牌主体（名字、车队、按钮）保持中性背景——促销卡的金色描边也已移除。',
      ],
      it: [
        'La scheda di una carta torna a essere inquadrata a dovere: pulsante di chiusura al suo posto, visual contenuto nella cornice arrotondata, ed effetto Wild che copre tutta la testata a ogni angolazione.',
        'I visual dei tipi restano ora nella zona superiore: il corpo della carta (nome, squadra, pulsanti) mantiene lo sfondo neutro — e il bordo dorato delle promo sparisce.',
      ],
      nl: [
        'De detailweergave van een kaart is weer netjes omkaderd: sluitknop terug op zijn plek, visual keurig binnen het afgeronde kader, en het Wild-effect vult de hele kop onder elke hoek.',
        'De typevisuals blijven voortaan in de bovenzone: de kaartromp (naam, team, knoppen) behoudt zijn neutrale achtergrond — en de gouden rand op promo’s is weg.',
      ],
      de: [
        'Die Detailansicht einer Karte ist wieder sauber gerahmt: Schließen-Knopf an seinem Platz, Visual sauber im abgerundeten Rahmen, und der Wild-Effekt füllt den Kopfbereich in jedem Winkel.',
        'Die Typ-Visuals bleiben jetzt im oberen Bereich: der Kartenkörper (Name, Team, Knöpfe) behält seinen neutralen Hintergrund — und der goldene Rand der Promos ist weg.',
      ],
    },
  },
  {
    version: '1.4.0',
    date: '2026-07-12',
    changes: {
      en: [
        'A fresh look for every card type: deep, calm backgrounds; one clean light streak gliding across the foils; fused colours on dual foils; a golden flow on promos — the hierarchy reads at a glance. Wild Foil is untouched.',
      ],
      fr: [
        'Nouveau look pour tous les types de cartes : fonds profonds et calmes, un unique reflet lumineux qui glisse sur les foils, couleurs fusionnées sur les doubles foils, flux doré sur les promos — la hiérarchie se lit d’un coup d’œil. Le Wild Foil ne change pas.',
      ],
      es: [
        'Nuevo aspecto para todos los tipos de carta: fondos profundos y serenos, un único destello de luz que se desliza por los foils, colores fusionados en los dobles foils, flujo dorado en las promos — la jerarquía se lee de un vistazo. El Wild Foil no cambia.',
      ],
      zh: [
        '所有卡牌类型焕然一新：深邃沉稳的底色，箔卡上滑过的单道光泽，双箔卡的色彩融合，促销卡的金色流光——稀有层级一目了然。Wild Foil 保持不变。',
      ],
      it: [
        'Nuovo look per tutti i tipi di carta: sfondi profondi e calmi, un unico riflesso di luce che scorre sui foil, colori fusi sui doppi foil, flusso dorato sulle promo — la gerarchia si legge a colpo d’occhio. Il Wild Foil resta invariato.',
      ],
      nl: [
        'Een nieuwe look voor elk kaarttype: diepe, rustige achtergronden; één zuivere lichtstreep die over de foils glijdt; versmolten kleuren op dubbele foils; een gouden stroom op promo’s — de hiërarchie lees je in één oogopslag. Wild Foil blijft onaangeroerd.',
      ],
      de: [
        'Ein frischer Look für jeden Kartentyp: tiefe, ruhige Hintergründe; ein einzelner Lichtstreif, der über die Foils gleitet; verschmolzene Farben bei Dual-Foils; ein goldener Fluss bei Promos — die Hierarchie ist auf einen Blick lesbar. Wild Foil bleibt unverändert.',
      ],
    },
  },
  {
    version: '1.3.0',
    date: '2026-07-12',
    changes: {
      en: [
        'A card’s detail view now shows the real visual of its type — Wild, Nitro, dual foils and promos shine there just like in the grid. No more dull grey header.',
      ],
      fr: [
        'La fiche d’une carte affiche désormais le vrai visuel de son type — Wild, Nitro, doubles foils et promos y brillent comme dans la grille. Fini le bandeau gris terne.',
      ],
      es: [
        'La ficha de una carta ahora muestra el visual real de su tipo — Wild, Nitro, dobles foils y promos brillan allí como en la cuadrícula. Se acabó la cabecera gris apagada.',
      ],
      zh: [
        '卡牌详情页现在会显示其类型的真实视觉效果——Wild、Nitro、双箔和促销卡在详情页中和网格里一样闪耀。灰暗的顶部背景一去不返。',
      ],
      it: [
        'La scheda di una carta ora mostra il vero visual del suo tipo — Wild, Nitro, doppi foil e promo vi brillano come nella griglia. Basta con l’intestazione grigia spenta.',
      ],
      nl: [
        'De detailweergave van een kaart toont nu het echte visuele effect van haar type — Wild, Nitro, dubbele foils en promo’s schitteren er net als in het raster. Geen doffe grijze kop meer.',
      ],
      de: [
        'Die Detailansicht einer Karte zeigt jetzt das echte Typ-Visual — Wild, Nitro, Dual-Foils und Promos glänzen dort wie im Raster. Schluss mit dem tristen grauen Kopfbereich.',
      ],
    },
  },
  {
    version: '1.2.0',
    date: '2026-07-12',
    changes: {
      en: [
        'Optional local-data encryption (Settings → Security, requires the PIN): your collection is stored encrypted in the browser. Warning: a forgotten PIN makes the local data unrecoverable — back up first.',
      ],
      fr: [
        'Chiffrement optionnel des données locales (Réglages → Sécurité, nécessite le PIN) : ta collection est stockée chiffrée dans le navigateur. Attention : PIN oublié = données locales irrécupérables — sauvegarde d’abord.',
      ],
      es: [
        'Cifrado opcional de los datos locales (Ajustes → Seguridad, requiere el PIN): tu colección se guarda cifrada en el navegador. Atención: un PIN olvidado hace los datos locales irrecuperables — haz una copia primero.',
      ],
      zh: [
        '可选的本地数据加密（设置 → 安全，需要 PIN）：你的收藏将加密存储在浏览器中。注意：忘记 PIN 将导致本地数据无法恢复——请先备份。',
      ],
      it: [
        'Cifratura opzionale dei dati locali (Impostazioni → Sicurezza, richiede il PIN): la collezione è salvata cifrata nel browser. Attenzione: PIN dimenticato = dati locali irrecuperabili — fai prima un backup.',
      ],
      nl: [
        'Optionele versleuteling van lokale gegevens (Instellingen → Beveiliging, vereist de pincode): je collectie wordt versleuteld opgeslagen in de browser. Let op: pincode vergeten = lokale gegevens onherstelbaar — maak eerst een back-up.',
      ],
      de: [
        'Optionale Verschlüsselung der lokalen Daten (Einstellungen → Sicherheit, erfordert die PIN): deine Sammlung wird verschlüsselt im Browser gespeichert. Achtung: vergessene PIN = lokale Daten unwiederbringlich — vorher sichern.',
      ],
    },
  },
  {
    version: '1.1.0',
    date: '2026-07-12',
    changes: {
      en: [
        'More readable rarity chips: white text on every rarity, with the orange (legendary), green (mythic) and red (ultra) backgrounds slightly darkened to keep full contrast.',
        'Quality: every code change is now verified by the automated test suite before it can be published.',
      ],
      fr: [
        'Pastilles de rareté plus lisibles : texte blanc sur toutes les raretés, avec les fonds orange (légendaire), vert (mythique) et rouge (ultra) légèrement assombris pour garder un contraste parfait.',
        'Qualité : chaque modification du code est désormais vérifiée par la suite de tests automatique avant de pouvoir être publiée.',
      ],
      es: [
        'Chips de rareza más legibles: texto blanco en todas las rarezas, con los fondos naranja (legendaria), verde (mítica) y rojo (ultra) ligeramente oscurecidos para mantener el contraste.',
        'Calidad: cada cambio del código ahora se verifica con la batería de pruebas automática antes de poder publicarse.',
      ],
      zh: [
        '稀有度标签更易读：所有稀有度均为白色文字，橙色（传奇）、绿色（神话）和红色（超稀有）背景略微加深以保持对比度。',
        '质量保障：每次代码修改现在都会先通过自动测试套件的验证才能发布。',
      ],
      it: [
        'Chip di rarità più leggibili: testo bianco su tutte le rarità, con gli sfondi arancione (leggendaria), verde (mitica) e rosso (ultra) leggermente scuriti per mantenere il contrasto.',
        'Qualità: ogni modifica del codice viene ora verificata dalla suite di test automatica prima di poter essere pubblicata.',
      ],
      nl: [
        'Beter leesbare zeldzaamheidslabels: witte tekst op elke zeldzaamheid, met de oranje (legendarisch), groene (mythisch) en rode (ultra) achtergronden iets donkerder voor volledig contrast.',
        'Kwaliteit: elke codewijziging wordt voortaan door de automatische testsuite gecontroleerd voordat ze gepubliceerd kan worden.',
      ],
      de: [
        'Besser lesbare Seltenheits-Chips: weiße Schrift auf jeder Seltenheit, mit leicht abgedunkelten Hintergründen bei Orange (legendär), Grün (mythisch) und Rot (ultra) für vollen Kontrast.',
        'Qualität: jede Code-Änderung wird jetzt vor der Veröffentlichung automatisch von der Testsuite geprüft.',
      ],
    },
  },
  {
    version: '1.0.0',
    date: '2026-07-12',
    changes: {
      en: [
        'The app now updates itself: when a new version is online, a small banner offers to reload — no more manual cache clearing.',
        'Version history: this “What’s new” screen, also available anytime from Settings.',
        'The app version is shown at the bottom of Settings.',
      ],
      fr: [
        'L’app se met désormais à jour toute seule : quand une nouvelle version est en ligne, un petit bandeau propose de recharger — plus besoin de vider le cache.',
        'Historique des versions : cet écran « Nouveautés », consultable à tout moment depuis les Réglages.',
        'La version de l’app est affichée en bas des Réglages.',
      ],
      es: [
        'La aplicación ahora se actualiza sola: cuando hay una nueva versión en línea, un pequeño aviso propone recargar — se acabó vaciar la caché a mano.',
        'Historial de versiones: esta pantalla de «Novedades», disponible en cualquier momento desde Ajustes.',
        'La versión de la aplicación se muestra al final de Ajustes.',
      ],
      zh: [
        '应用现在会自动更新：当有新版本上线时，会出现一个小横幅提示重新加载——不再需要手动清除缓存。',
        '版本历史：这个“更新内容”页面，随时可以在设置中查看。',
        '应用版本号显示在设置底部。',
      ],
      it: [
        'L’app ora si aggiorna da sola: quando una nuova versione è online, un piccolo banner propone di ricaricare — basta svuotare la cache a mano.',
        'Cronologia delle versioni: questa schermata «Novità», consultabile in ogni momento dalle Impostazioni.',
        'La versione dell’app è mostrata in fondo alle Impostazioni.',
      ],
      nl: [
        'De app werkt zichzelf voortaan bij: zodra er een nieuwe versie online staat, stelt een kleine banner voor om te herladen — nooit meer handmatig de cache legen.',
        'Versiegeschiedenis: dit “Wat is nieuw”-scherm, altijd te openen via Instellingen.',
        'De appversie staat onderaan in Instellingen.',
      ],
      de: [
        'Die App aktualisiert sich jetzt selbst: Sobald eine neue Version online ist, bietet ein kleines Banner das Neuladen an — kein manuelles Cache-Leeren mehr.',
        'Versionsverlauf: dieser „Neuigkeiten“-Bildschirm, jederzeit über die Einstellungen erreichbar.',
        'Die App-Version wird unten in den Einstellungen angezeigt.',
      ],
    },
  },
  {
    version: '0.9.0',
    date: '2026-07-11',
    changes: {
      en: [
        'Optional cloud backup: sign in with an email code and save/restore your collection in the cloud (manual, never automatic).',
        'Backups can include your preferences and — with an explicit warning — your PIN, on every channel (file, code, QR, cloud).',
        'Locking the app is now instant, and the PIN fields accept the Enter key.',
      ],
      fr: [
        'Sauvegarde cloud optionnelle : connexion par code reçu par e-mail, envoi/récupération manuelle de ta collection (jamais automatique).',
        'Les sauvegardes peuvent inclure tes préférences et — avec un avertissement explicite — ton PIN, sur tous les canaux (fichier, code, QR, cloud).',
        'Le verrouillage de l’app est désormais instantané, et les champs PIN acceptent la touche Entrée.',
      ],
      es: [
        'Copia en la nube opcional: inicia sesión con un código recibido por correo y envía/recupera tu colección manualmente (nunca automático).',
        'Las copias pueden incluir tus preferencias y — con una advertencia explícita — tu PIN, en todos los canales (archivo, código, QR, nube).',
        'El bloqueo de la aplicación ahora es instantáneo, y los campos del PIN aceptan la tecla Intro.',
      ],
      zh: [
        '可选云备份：通过邮件验证码登录，手动上传/恢复你的收藏（绝不自动）。',
        '备份可以包含你的偏好设置，以及——在明确警告下——你的 PIN，适用于所有渠道（文件、代码、二维码、云端）。',
        '应用锁定现在是即时的，PIN 输入框支持回车键。',
      ],
      it: [
        'Backup cloud opzionale: accedi con un codice ricevuto via e-mail e invia/recupera la collezione manualmente (mai automatico).',
        'I backup possono includere le tue preferenze e — con un avviso esplicito — il tuo PIN, su ogni canale (file, codice, QR, cloud).',
        'Il blocco dell’app ora è istantaneo, e i campi PIN accettano il tasto Invio.',
      ],
      nl: [
        'Optionele cloudback-up: log in met een code per e-mail en verstuur/herstel je collectie handmatig (nooit automatisch).',
        'Back-ups kunnen je voorkeuren bevatten en — met een expliciete waarschuwing — je pincode, via elk kanaal (bestand, code, QR, cloud).',
        'Het vergrendelen van de app is nu onmiddellijk, en de pincodevelden accepteren de Enter-toets.',
      ],
      de: [
        'Optionale Cloud-Sicherung: Anmeldung per E-Mail-Code, manuelles Senden/Wiederherstellen deiner Sammlung (nie automatisch).',
        'Sicherungen können deine Einstellungen enthalten und — mit ausdrücklicher Warnung — deine PIN, auf jedem Kanal (Datei, Code, QR, Cloud).',
        'Das Sperren der App ist jetzt sofortig, und die PIN-Felder akzeptieren die Eingabetaste.',
      ],
    },
  },
  {
    version: '0.8.0',
    date: '2026-07-09',
    changes: {
      en: [
        '“Install the app” button in Settings, with instructions tailored to your browser — including an honest message on browsers that can’t install web apps (Arc).',
        'New app icon: the card fan on F1 red.',
      ],
      fr: [
        'Bouton « Installer l’application » dans les Réglages, avec des instructions adaptées à ton navigateur — y compris un message honnête pour les navigateurs qui ne savent pas installer d’app web (Arc).',
        'Nouvelle icône : l’éventail de cartes sur fond rouge F1.',
      ],
      es: [
        'Botón «Instalar la aplicación» en Ajustes, con instrucciones adaptadas a tu navegador — incluido un mensaje honesto para los navegadores que no pueden instalar apps web (Arc).',
        'Nuevo icono: el abanico de cartas sobre rojo F1.',
      ],
      zh: [
        '设置中新增“安装应用”按钮，并根据你的浏览器提供相应指引——对无法安装网页应用的浏览器（Arc）给出诚实提示。',
        '新应用图标：F1 红底上的卡牌扇形。',
      ],
      it: [
        'Pulsante «Installa l’app» nelle Impostazioni, con istruzioni adatte al tuo browser — incluso un messaggio onesto per i browser che non sanno installare app web (Arc).',
        'Nuova icona: il ventaglio di carte su rosso F1.',
      ],
      nl: [
        'Knop “De app installeren” in Instellingen, met instructies op maat van je browser — inclusief een eerlijke melding voor browsers die geen webapps kunnen installeren (Arc).',
        'Nieuw app-pictogram: de kaartenwaaier op F1-rood.',
      ],
      de: [
        '„App installieren“-Knopf in den Einstellungen, mit Anleitungen passend zu deinem Browser — inklusive eines ehrlichen Hinweises für Browser ohne Web-App-Installation (Arc).',
        'Neues App-Symbol: der Kartenfächer auf F1-Rot.',
      ],
    },
  },
  {
    version: '0.7.0',
    date: '2026-07-08',
    changes: {
      en: [
        'Collector tools: shareable lists of your missing cards, doubles to trade, and a combined trade sheet (Settings).',
        'Interactive tutorial: a guided tour where you perform the real actions, replayable from Settings — your collection is untouched.',
        'Language chooser on the very first launch (7 languages).',
      ],
      fr: [
        'Outils de collectionneur : listes partageables de tes cartes manquantes, de tes doubles à échanger et une fiche de troc (Réglages).',
        'Tutoriel interactif : une visite guidée où tu fais les vrais gestes, rejouable depuis les Réglages — ta collection n’est pas touchée.',
        'Choix de la langue au tout premier lancement (7 langues).',
      ],
      es: [
        'Herramientas de coleccionista: listas compartibles de tus cartas que faltan, tus repetidas para cambiar y una hoja de intercambio (Ajustes).',
        'Tutorial interactivo: una visita guiada donde haces los gestos reales, repetible desde Ajustes — tu colección no se toca.',
        'Selector de idioma en el primer arranque (7 idiomas).',
      ],
      zh: [
        '收藏家工具：可分享的缺失卡片清单、可交换的重复卡清单，以及一份交换汇总表（设置）。',
        '交互式教程：一次让你亲手操作的引导之旅，可随时从设置中重玩——不会影响你的收藏。',
        '首次启动时可选择语言（7 种语言）。',
      ],
      it: [
        'Strumenti da collezionista: liste condivisibili delle carte mancanti, dei doppioni da scambiare e una scheda di scambio (Impostazioni).',
        'Tutorial interattivo: un tour guidato in cui compi i gesti reali, ripetibile dalle Impostazioni — la tua collezione resta intatta.',
        'Scelta della lingua al primissimo avvio (7 lingue).',
      ],
      nl: [
        'Verzamelaarstools: deelbare lijsten van je ontbrekende kaarten, je dubbele om te ruilen en een ruiloverzicht (Instellingen).',
        'Interactieve tutorial: een rondleiding waarin je de echte handelingen uitvoert, opnieuw te spelen via Instellingen — je collectie blijft onaangeroerd.',
        'Taalkeuze bij de allereerste start (7 talen).',
      ],
      de: [
        'Sammler-Werkzeuge: teilbare Listen deiner fehlenden Karten, deiner Dubletten zum Tauschen und ein Tauschblatt (Einstellungen).',
        'Interaktives Tutorial: eine geführte Tour, in der du die echten Handgriffe machst, jederzeit aus den Einstellungen wiederholbar — deine Sammlung bleibt unberührt.',
        'Sprachauswahl beim allerersten Start (7 Sprachen).',
      ],
    },
  },
  {
    version: '0.6.0',
    date: '2026-07-07',
    changes: {
      en: [
        'New 6-level rarity scale (Epic → Divine), with a shimmering animated finish for Divine.',
        'Full-colour rarity chips and a livelier palette.',
        '5 font themes to pick from in Settings — all fonts ship with the app, nothing is downloaded.',
      ],
      fr: [
        'Nouvelle échelle de rareté à 6 niveaux (Épique → Divin), avec un rendu irisé animé pour Divin.',
        'Pastilles de rareté en couleurs pleines et palette plus vive.',
        '5 thèmes de police au choix dans les Réglages — toutes les polices sont embarquées, rien n’est téléchargé.',
      ],
      es: [
        'Nueva escala de rareza de 6 niveles (Épica → Divina), con un acabado iridiscente animado para Divina.',
        'Chips de rareza a todo color y una paleta más viva.',
        '5 temas de fuente a elegir en Ajustes — todas las fuentes van con la app, no se descarga nada.',
      ],
      zh: [
        '全新 6 级稀有度体系（史诗 → 神圣），神圣级带有流光溢彩的动画效果。',
        '稀有度标签改为全彩显示，配色更鲜活。',
        '设置中可选 5 种字体主题——所有字体随应用内置，无需任何下载。',
      ],
      it: [
        'Nuova scala di rarità a 6 livelli (Epica → Divina), con una finitura iridescente animata per Divina.',
        'Chip di rarità a colori pieni e una palette più vivace.',
        '5 temi di caratteri tra cui scegliere nelle Impostazioni — tutti i font sono inclusi nell’app, niente download.',
      ],
      nl: [
        'Nieuwe zeldzaamheidsschaal met 6 niveaus (Episch → Goddelijk), met een glinsterende animatie voor Goddelijk.',
        'Zeldzaamheidslabels in volle kleuren en een levendiger palet.',
        '5 lettertypethema’s te kiezen in Instellingen — alle lettertypen zitten in de app, er wordt niets gedownload.',
      ],
      de: [
        'Neue 6-stufige Seltenheitsskala (Episch → Göttlich), mit einem schillernden animierten Finish für Göttlich.',
        'Vollfarbige Seltenheits-Chips und eine lebendigere Palette.',
        '5 Schrift-Themen zur Auswahl in den Einstellungen — alle Schriften sind in der App enthalten, nichts wird heruntergeladen.',
      ],
    },
  },
  {
    version: '0.5.0',
    date: '2026-07-04',
    changes: {
      en: [
        'Install the app on your device: it now works fully offline.',
        'Device-to-device backup: generate a code (or a QR to scan) and restore your collection on another device — no file, no server.',
        'A gentle reminder nudges you to back up after 30 changes or 14 days.',
        'Richer Stats: day-by-day progression curve, your rarest card, total copies, and a rarity donut.',
      ],
      fr: [
        'Installe l’app sur ton appareil : elle fonctionne désormais 100 % hors-ligne.',
        'Sauvegarde d’appareil à appareil : génère un code (ou un QR à scanner) et restaure ta collection ailleurs — sans fichier, sans serveur.',
        'Un rappel discret t’invite à sauvegarder après 30 modifications ou 14 jours.',
        'Stats enrichies : courbe de progression jour par jour, ta carte la plus rare, le total d’exemplaires et un donut par rareté.',
      ],
      es: [
        'Instala la app en tu dispositivo: ahora funciona 100 % sin conexión.',
        'Copia de dispositivo a dispositivo: genera un código (o un QR para escanear) y restaura tu colección en otro aparato — sin archivo, sin servidor.',
        'Un recordatorio discreto te invita a hacer copia tras 30 cambios o 14 días.',
        'Estadísticas más ricas: curva de progresión día a día, tu carta más rara, el total de ejemplares y un donut por rareza.',
      ],
      zh: [
        '把应用安装到你的设备上：现在可以完全离线使用。',
        '设备间备份：生成一个代码（或可扫描的二维码），即可在另一台设备上恢复你的收藏——无需文件，无需服务器。',
        '在 30 次修改或 14 天后，会有一个不打扰的提醒建议你备份。',
        '更丰富的统计：逐日进度曲线、你最稀有的卡、总张数，以及按稀有度的环形图。',
      ],
      it: [
        'Installa l’app sul tuo dispositivo: ora funziona completamente offline.',
        'Backup da dispositivo a dispositivo: genera un codice (o un QR da scansionare) e ripristina la collezione altrove — senza file, senza server.',
        'Un promemoria discreto ti invita a fare backup dopo 30 modifiche o 14 giorni.',
        'Statistiche più ricche: curva di progressione giorno per giorno, la tua carta più rara, il totale delle copie e una ciambella per rarità.',
      ],
      nl: [
        'Installeer de app op je toestel: ze werkt nu volledig offline.',
        'Back-up van toestel naar toestel: genereer een code (of een QR om te scannen) en herstel je collectie elders — zonder bestand, zonder server.',
        'Een discrete herinnering stelt na 30 wijzigingen of 14 dagen een back-up voor.',
        'Rijkere statistieken: voortgangscurve per dag, je zeldzaamste kaart, het totale aantal exemplaren en een donut per zeldzaamheid.',
      ],
      de: [
        'Installiere die App auf deinem Gerät: sie funktioniert jetzt vollständig offline.',
        'Gerät-zu-Gerät-Sicherung: erzeuge einen Code (oder einen QR zum Scannen) und stelle deine Sammlung anderswo wieder her — ohne Datei, ohne Server.',
        'Eine dezente Erinnerung schlägt nach 30 Änderungen oder 14 Tagen eine Sicherung vor.',
        'Reichere Statistiken: Tag-für-Tag-Fortschrittskurve, deine seltenste Karte, die Gesamtzahl der Exemplare und ein Seltenheits-Donut.',
      ],
    },
  },
];

// The app version IS the newest changelog entry — one source of truth.
export const APP_VERSION = CHANGELOG[0].version;

/* ── Pure helpers (unit-tested) ── */

// Numeric semver-ish compare: -1 / 0 / 1. '1.10.0' > '1.9.0'.
export function compareVersions(a, b){
  const pa = String(a).split('.').map(n => parseInt(n, 10) || 0);
  const pb = String(b).split('.').map(n => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for(let i = 0; i < len; i++){
    const d = (pa[i] || 0) - (pb[i] || 0);
    if(d) return d < 0 ? -1 : 1;
  }
  return 0;
}

// Entries strictly newer than `lastSeen` (newest first, like CHANGELOG).
// No baseline recorded → nothing to announce (fresh installs must not
// be greeted with the full history).
export function entriesSince(lastSeen, list = CHANGELOG){
  if(!lastSeen) return [];
  return list.filter(e => compareVersions(e.version, lastSeen) > 0);
}

// Texts of an entry in the given language (English as the app-wide fallback).
export function changesFor(entry, lang){
  const c = (entry && entry.changes) || {};
  return c[lang] || c.en || [];
}
