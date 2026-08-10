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
    version: '1.49.2',
    date: '2026-08-09',
    changes: {
      en: [
        'Fixed a broken badge link at the top of the README in all six translated versions — it was showing raw link text instead of the badge.',
      ],
      fr: [
        'Correction d\'un lien de badge cassé en tête du README dans les six versions traduites — il affichait du texte de lien brut au lieu du badge.',
      ],
      es: [
        'Corregido un enlace de insignia roto al principio del README en las seis versiones traducidas — mostraba texto de enlace en bruto en vez de la insignia.',
      ],
      zh: [
        '修复了六个翻译版本 README 顶部一个损坏的徽章链接——它显示的是原始链接文本，而不是徽章。',
      ],
      it: [
        'Corretto un link di badge rotto in cima al README nelle sei versioni tradotte — mostrava testo di link grezzo invece del badge.',
      ],
      nl: [
        'Een kapotte badge-link boven aan de README hersteld in alle zes vertaalde versies — die toonde ruwe linktekst in plaats van de badge.',
      ],
      de: [
        'Ein defekter Badge-Link am Anfang der README wurde in allen sechs übersetzten Fassungen repariert — er zeigte rohen Linktext statt des Abzeichens.',
      ],
    },
  },
  {
    version: '1.49.1',
    date: '2026-08-09',
    changes: {
      en: [
        'The README now carries the project\'s code-quality grade as a badge — along with the two measurements that are still in the red behind it, rather than only the good news.',
      ],
      fr: [
        'Le README porte désormais la note de qualité du code sous forme de badge — accompagnée des deux mesures encore au rouge derrière elle, plutôt que de la seule bonne nouvelle.',
      ],
      es: [
        'El README lleva ahora la nota de calidad del código como insignia — junto con las dos mediciones que siguen en rojo detrás de ella, en lugar de solo la buena noticia.',
      ],
      zh: [
        'README 现在以徽章形式展示项目的代码质量评级——同时也写出它背后仍然亮红的两项指标，而不是只报喜。',
      ],
      it: [
        'Il README porta ora il voto di qualità del codice come badge — insieme alle due misure ancora in rosso dietro di esso, invece della sola buona notizia.',
      ],
      nl: [
        'De README draagt nu het codekwaliteitscijfer als badge — samen met de twee metingen die er nog rood achter staan, in plaats van alleen het goede nieuws.',
      ],
      de: [
        'Die README trägt jetzt die Code-Qualitätsnote als Abzeichen — zusammen mit den zwei Messwerten, die dahinter noch auf Rot stehen, statt nur der guten Nachricht.',
      ],
    },
  },
  {
    version: '1.49.0',
    date: '2026-08-09',
    changes: {
      en: [
        'Settings → About now has two links: a Ko-fi page where you can follow me or chip in, and the project\'s source code on GitHub. The app is free and stays free — nothing here is locked behind anything.',
      ],
      fr: [
        'Réglages → À propos porte maintenant deux liens : une page Ko-fi où vous pouvez me suivre ou soutenir le travail, et le code source du projet sur GitHub. L\'app est gratuite et le reste — rien n\'y est verrouillé derrière quoi que ce soit.',
      ],
      es: [
        'Ajustes → Acerca de tiene ahora dos enlaces: una página de Ko-fi donde puedes seguirme o aportar, y el código fuente del proyecto en GitHub. La app es gratuita y lo seguirá siendo — aquí no hay nada bloqueado tras nada.',
      ],
      zh: [
        '设置 → 关于现在有两个链接：一个 Ko-fi 页面，你可以在那里关注我或支持一下；以及项目在 GitHub 上的源代码。这个应用是免费的，而且会一直免费——这里没有任何东西被锁在门后。',
      ],
      it: [
        'Impostazioni → Info ora contiene due link: una pagina Ko-fi dove puoi seguirmi o dare una mano, e il codice sorgente del progetto su GitHub. L\'app è gratuita e resta gratuita — qui non c\'è nulla chiuso dietro a niente.',
      ],
      nl: [
        'Instellingen → Over heeft nu twee links: een Ko-fi-pagina waar je me kunt volgen of kunt bijdragen, en de broncode van het project op GitHub. De app is gratis en blijft gratis — er zit hier niets achter slot en grendel.',
      ],
      de: [
        'Einstellungen → Über enthält jetzt zwei Links: eine Ko-fi-Seite, wo Sie mir folgen oder etwas beitragen können, und den Quellcode des Projekts auf GitHub. Die App ist kostenlos und bleibt es — hier ist nichts hinter irgendetwas weggesperrt.',
      ],
    },
  },
  {
    version: '1.48.0',
    date: '2026-08-09',
    changes: {
      en: [
        'The quantity buttons in a card\'s detail view now announce what they do to screen readers, instead of reading as a bare “plus” and “minus”.',
        'Four controls were easier to miss than to hit — the email field, the language menu, the backup checkboxes and those quantity buttons. All four now meet the 44-pixel touch target.',
      ],
      fr: [
        'Les boutons de quantité d\'une carte annoncent enfin ce qu\'ils font aux lecteurs d\'écran, au lieu de se lire « plus » et « moins » sans contexte.',
        'Quatre contrôles se rataient plus facilement qu\'ils ne s\'atteignaient — le champ e-mail, le menu de langue, les cases de sauvegarde et ces boutons de quantité. Les quatre respectent maintenant la cible tactile de 44 pixels.',
      ],
      es: [
        'Los botones de cantidad de una carta ya anuncian lo que hacen a los lectores de pantalla, en lugar de leerse como un simple «más» y «menos».',
        'Cuatro controles se fallaban más fácilmente de lo que se acertaban — el campo de correo, el menú de idioma, las casillas de copia de seguridad y esos botones de cantidad. Los cuatro cumplen ahora el objetivo táctil de 44 píxeles.',
      ],
      zh: [
        '卡片详情里的数量按钮现在会向屏幕阅读器说明自己的作用，而不再只读作孤零零的「加」和「减」。',
        '有四个控件更容易点偏而不是点中——邮箱输入框、语言菜单、备份复选框，以及那两个数量按钮。四者现在都达到了 44 像素的触控目标。',
      ],
      it: [
        'I pulsanti di quantità di una carta annunciano finalmente cosa fanno agli screen reader, invece di leggersi come un nudo «più» e «meno».',
        'Quattro controlli si mancavano più facilmente di quanto si centrassero — il campo e-mail, il menu della lingua, le caselle di backup e quei pulsanti di quantità. Tutti e quattro rispettano ora il bersaglio tattile di 44 pixel.',
      ],
      nl: [
        'De aantalknoppen bij een kaart vertellen schermlezers nu wat ze doen, in plaats van als een kaal «plus» en «min» te klinken.',
        'Vier bedieningselementen werden makkelijker gemist dan geraakt — het e-mailveld, het taalmenu, de back-upvinkjes en die aantalknoppen. Alle vier halen nu het aanraakdoel van 44 pixels.',
      ],
      de: [
        'Die Mengen-Schaltflächen einer Karte kündigen Screenreadern jetzt an, was sie tun, statt als nacktes «Plus» und «Minus» gelesen zu werden.',
        'Vier Bedienelemente wurden leichter verfehlt als getroffen — das E-Mail-Feld, das Sprachmenü, die Backup-Kästchen und eben jene Mengen-Schaltflächen. Alle vier erreichen nun das 44-Pixel-Touchziel.',
      ],
    },
  },
  {
    version: '1.47.5',
    date: '2026-08-09',
    changes: {
      en: [
        'A new “Support the developer” row in Settings → About opens a Ko-fi page in a new tab. It is a plain link — nothing is loaded from outside, nothing leaves your device, and donating unlocks nothing at all.',
      ],
      fr: [
        'Une nouvelle ligne « Soutenir le créateur » dans Réglages → À propos ouvre une page Ko-fi dans un nouvel onglet. C\'est un simple lien : rien n\'est chargé de l\'extérieur, rien ne quitte votre appareil, et donner ne débloque strictement rien.',
      ],
      es: [
        'Una nueva fila «Apoyar al creador» en Ajustes → Acerca de abre una página de Ko-fi en una pestaña nueva. Es un enlace simple: no se carga nada externo, nada sale de tu dispositivo y donar no desbloquea absolutamente nada.',
      ],
      zh: [
        '设置 → 关于中新增「支持创作者」一行，会在新标签页打开一个 Ko-fi 页面。它只是一个普通链接：不加载任何外部内容，不会有数据离开你的设备，捐赠也不会解锁任何东西。',
      ],
      it: [
        'Una nuova riga «Sostieni il creatore» in Impostazioni → Info apre una pagina Ko-fi in una nuova scheda. È un semplice link: non viene caricato nulla dall\'esterno, nulla lascia il tuo dispositivo e donare non sblocca proprio niente.',
      ],
      nl: [
        'Een nieuwe regel «De maker steunen» in Instellingen → Over opent een Ko-fi-pagina in een nieuw tabblad. Het is gewoon een link: er wordt niets van buitenaf geladen, er verlaat niets je apparaat, en doneren ontgrendelt helemaal niets.',
      ],
      de: [
        'Eine neue Zeile «Den Entwickler unterstützen» unter Einstellungen → Über öffnet eine Ko-fi-Seite in einem neuen Tab. Es ist ein schlichter Link: Es wird nichts von außen geladen, nichts verlässt Ihr Gerät, und eine Spende schaltet überhaupt nichts frei.',
      ],
    },
  },
  {
    version: '1.47.4',
    date: '2026-08-09',
    changes: {
      en: [
        'Importing a backup from a different season no longer mixes the two collections together: the season is switched properly first, so what you import lands where it belongs and the other season stays untouched.',
        'The title you wear now belongs to its season. A title earned in one season is no longer worn in another — your current title is kept as you migrate.',
        'Deleting your local data now also clears the worn title and the pinned badge, instead of leaving them behind.',
      ],
      fr: [
        'Importer une sauvegarde d\'une autre saison ne mélange plus les deux collections : la saison est réellement changée avant l\'import, ce que vous importez se range au bon endroit, et l\'autre saison reste intacte.',
        'Le titre que vous portez appartient désormais à sa saison. Un titre gagné dans une saison ne se porte plus dans une autre — votre titre actuel est conservé lors de la mise à jour.',
        'La suppression des données locales efface aussi le titre porté et le badge épinglé, au lieu de les laisser derrière elle.',
      ],
      es: [
        'Importar una copia de seguridad de otra temporada ya no mezcla ambas colecciones: la temporada se cambia de verdad antes de importar, lo que importas va donde corresponde y la otra temporada queda intacta.',
        'El título que llevas ahora pertenece a su temporada. Un título ganado en una temporada ya no se lleva en otra — tu título actual se conserva al actualizar.',
        'Borrar los datos locales elimina también el título llevado y la insignia fijada, en vez de dejarlos atrás.',
      ],
      zh: [
        '导入其他赛季的备份不再把两份收藏混在一起:导入前会真正切换赛季,导入的内容归入正确位置,另一个赛季保持原样。',
        '你佩戴的称号现在归属于所在赛季。某个赛季获得的称号不再出现在另一个赛季——升级时会保留你当前的称号。',
        '删除本地数据现在也会清除佩戴的称号和置顶徽章,而不是把它们留下。',
      ],
      it: [
        'Importare un backup di un\'altra stagione non mescola più le due collezioni: la stagione viene cambiata davvero prima dell\'importazione, ciò che importi finisce al posto giusto e l\'altra stagione resta intatta.',
        'Il titolo che porti appartiene ora alla sua stagione. Un titolo ottenuto in una stagione non si porta più in un\'altra — il tuo titolo attuale viene conservato durante l\'aggiornamento.',
        'L\'eliminazione dei dati locali cancella anche il titolo portato e il badge fissato, invece di lasciarli indietro.',
      ],
      nl: [
        'Een back-up van een ander seizoen importeren gooit de twee collecties niet meer door elkaar: het seizoen wordt eerst echt gewisseld, wat je importeert komt op de juiste plek terecht en het andere seizoen blijft ongemoeid.',
        'De titel die je draagt hoort nu bij zijn seizoen. Een titel die je in één seizoen verdient, draag je niet meer in een ander — je huidige titel blijft bij het bijwerken behouden.',
        'Het wissen van je lokale gegevens verwijdert nu ook de gedragen titel en de vastgezette badge, in plaats van ze achter te laten.',
      ],
      de: [
        'Der Import einer Sicherung aus einer anderen Saison vermischt die beiden Sammlungen nicht mehr: Die Saison wird zuerst wirklich gewechselt, das Importierte landet am richtigen Ort, und die andere Saison bleibt unberührt.',
        'Der getragene Titel gehört jetzt zu seiner Saison. Ein in einer Saison erworbener Titel wird in einer anderen nicht mehr getragen — Ihr aktueller Titel bleibt beim Aktualisieren erhalten.',
        'Das Löschen der lokalen Daten entfernt nun auch den getragenen Titel und das angeheftete Abzeichen, statt sie zurückzulassen.',
      ],
    },
  },
  {
    version: '1.47.3',
    date: '2026-08-09',
    changes: {
      en: [
        'Housekeeping: five leftovers from earlier refactors removed, and the analyser configuration fixed so it stops reporting rules it could not load. Nothing changes on screen.',
      ],
      fr: [
        'Ménage : cinq reliquats d\'anciens remaniements supprimés, et la configuration de l\'analyseur corrigée pour qu\'il cesse de signaler des règles qu\'il n\'arrivait pas à charger. Rien ne change à l\'écran.',
      ],
      es: [
        'Limpieza: eliminados cinco restos de refactorizaciones anteriores y corregida la configuración del analizador para que deje de informar reglas que no podía cargar. Nada cambia en pantalla.',
      ],
      zh: [
        '清理:移除了此前重构留下的五处残余,并修正了分析器配置,使其不再报告自己无法加载的规则。界面没有任何变化。',
      ],
      it: [
        'Pulizia: rimossi cinque residui di rifacimenti precedenti e corretta la configurazione dell\'analizzatore perché smetta di segnalare regole che non riusciva a caricare. Sullo schermo non cambia nulla.',
      ],
      nl: [
        'Opruiming: vijf overblijfselen van eerdere herzieningen verwijderd, en de configuratie van de analyser gecorrigeerd zodat die stopt met het melden van regels die hij niet kon laden. Op het scherm verandert er niets.',
      ],
      de: [
        'Aufräumen: fünf Überbleibsel früherer Umbauten entfernt und die Analyser-Konfiguration korrigiert, damit sie keine Regeln mehr meldet, die sie nicht laden konnte. Auf dem Bildschirm ändert sich nichts.',
      ],
    },
  },
  {
    version: '1.47.2',
    date: '2026-08-09',
    changes: {
      en: [
        'Documentation and screenshots refreshed: every capture now shows the app as it actually is — the rebuilt tour, the calmer foils, the unified page headers, the grid without its old toolbar. The README gains an architecture diagram and an honest account of what the tests do and do not cover.',
      ],
      fr: [
        'Documentation et captures rafraîchies : chaque image montre désormais l\'app telle qu\'elle est vraiment — la visite refaite, les foils apaisés, les en-têtes de page unifiés, la grille sans son ancienne barre. Le README gagne un schéma d\'architecture et un état honnête de ce que les tests couvrent et ne couvrent pas.',
      ],
      es: [
        'Documentación y capturas actualizadas: cada imagen muestra ahora la app tal como es — la visita rehecha, los foils calmados, las cabeceras de página unificadas, la cuadrícula sin su antigua barra. El README gana un diagrama de arquitectura y un balance honesto de lo que las pruebas cubren y lo que no.',
      ],
      zh: [
        '文档与截图已刷新:每一张图现在都如实呈现应用的样子——重做的导览、减弱后的闪卡、统一的页首、去掉旧工具栏的网格。README 新增架构示意图,以及关于测试覆盖与未覆盖范围的诚实说明。',
      ],
      it: [
        'Documentazione e screenshot aggiornati: ogni immagine mostra ora l\'app com\'è davvero — la visita rifatta, i foil attenuati, le intestazioni di pagina unificate, la griglia senza la vecchia barra. Il README guadagna uno schema dell\'architettura e un resoconto onesto di ciò che i test coprono e non coprono.',
      ],
      nl: [
        'Documentatie en schermafbeeldingen ververst: elke opname toont de app nu zoals die echt is — de herbouwde rondleiding, de rustiger foils, de eenvormige paginakoppen, het raster zonder de oude balk. De README krijgt een architectuurschema en een eerlijk overzicht van wat de tests wel en niet dekken.',
      ],
      de: [
        'Dokumentation und Screenshots aufgefrischt: Jede Aufnahme zeigt die App jetzt so, wie sie wirklich ist — die neu gebaute Tour, die ruhigeren Foils, die einheitlichen Seitenköpfe, das Raster ohne die alte Leiste. Die README erhält ein Architekturdiagramm und eine ehrliche Aufstellung, was die Tests abdecken und was nicht.',
      ],
    },
  },
  {
    version: '1.47.1',
    date: '2026-08-09',
    changes: {
      en: [
        'Security pass. A hostile backup file could hide code inside your worn title and run it when the app displayed it — the same route as the link flaw fixed earlier. Titles now store only their name tag, and what you see always comes from the badges you actually unlocked. Your current title is kept.',
        'Two smaller hardenings while we were there: the PIN check no longer takes a measurably different time depending on how much of the code is right, and card images are restricted to files shipped with the app.',
      ],
      fr: [
        'Passe de sécurité. Un fichier de sauvegarde hostile pouvait cacher du code dans ton titre porté et le faire exécuter au moment de l\'afficher — la même voie que la faille du lien corrigée plus tôt. Les titres ne gardent plus que leur étiquette, et ce que tu vois vient toujours des badges que tu as vraiment débloqués. Ton titre actuel est conservé.',
        'Deux durcissements plus discrets au passage : la vérification du code PIN ne prend plus un temps mesurablement différent selon la part du code qui est juste, et les images de cartes sont restreintes aux fichiers livrés avec l\'application.',
      ],
      es: [
        'Pasada de seguridad. Un archivo de copia hostil podía esconder código en tu título llevado y ejecutarlo al mostrarlo — la misma vía que el fallo del enlace ya corregido. Los títulos solo guardan su etiqueta, y lo que ves viene siempre de las insignias que de verdad has desbloqueado. Tu título actual se conserva.',
        'Dos refuerzos menores de paso: la comprobación del PIN ya no tarda un tiempo medible distinto según qué parte del código sea correcta, y las imágenes de carta se limitan a los archivos que vienen con la aplicación.',
      ],
      zh: [
        '安全加固。一个恶意备份文件可以把代码藏进你佩戴的称号里,并在显示时执行——与此前修复的链接漏洞是同一条路径。称号现在只保存标识,你看到的内容始终来自你真正解锁的徽章。你当前的称号会保留。',
        '顺带两项较小的加固:PIN 校验不再因输入正确的位数不同而耗时可测地不同;卡面图片仅限应用自带的文件。',
      ],
      it: [
        'Passata di sicurezza. Un file di backup ostile poteva nascondere codice nel titolo che porti ed eseguirlo al momento di mostrarlo — la stessa via della falla del link già corretta. I titoli conservano solo la loro etichetta, e ciò che vedi viene sempre dai distintivi che hai davvero sbloccato. Il titolo attuale è mantenuto.',
        'Due irrobustimenti minori strada facendo: la verifica del PIN non impiega più un tempo misurabilmente diverso a seconda di quanta parte del codice è giusta, e le immagini delle carte sono limitate ai file forniti con l\'app.',
      ],
      nl: [
        'Beveiligingsronde. Een vijandig back-upbestand kon code verstoppen in je gedragen titel en die laten uitvoeren zodra hij werd getoond — dezelfde route als het eerder verholpen linklek. Titels bewaren nog alleen hun label, en wat je ziet komt altijd uit de badges die je echt hebt vrijgespeeld. Je huidige titel blijft behouden.',
        'Twee kleinere verstevigingen onderweg: de pincontrole duurt niet langer meetbaar anders naargelang hoeveel van de code klopt, en kaartafbeeldingen zijn beperkt tot bestanden die met de app worden meegeleverd.',
      ],
      de: [
        'Sicherheitsdurchgang. Eine feindliche Sicherungsdatei konnte Code in deinem getragenen Titel verstecken und beim Anzeigen ausführen lassen — derselbe Weg wie die zuvor behobene Link-Lücke. Titel speichern nur noch ihr Kürzel, und was du siehst, stammt immer aus den Abzeichen, die du wirklich freigeschaltet hast. Dein aktueller Titel bleibt erhalten.',
        'Zwei kleinere Härtungen nebenbei: Die PIN-Prüfung braucht nicht mehr messbar unterschiedlich lange, je nachdem wie viel des Codes stimmt, und Kartenbilder sind auf mitgelieferte Dateien beschränkt.',
      ],
    },
  },
  {
    version: '1.47.0',
    date: '2026-08-09',
    changes: {
      en: [
        'The guided tour is rebuilt as five chapters, one per page, in the order of the tabs. You always know which chapter you are in, how many steps are left, and you can skip a whole chapter or leave at any time.',
        'No more staring at a greyed-out screen wondering where to look: each step now brings its target into view by itself and checks it really is visible before showing you anything. The bubble picks its own side, never runs off screen and never sits on top of what it is pointing at.',
        'New in the tour: complete sets and the Eternal rarity, the Account page, and quick add. Every step where you have to do something also offers a way past it — nobody gets stuck.',
      ],
      fr: [
        'La visite guidée est refaite en cinq chapitres, un par page, dans l\'ordre des onglets. Tu sais toujours dans quel chapitre tu es, combien d\'étapes il reste, et tu peux passer un chapitre entier ou partir quand tu veux.',
        'Fini l\'écran grisé où l\'on cherche où regarder : chaque étape amène sa cible à l\'écran toute seule et vérifie qu\'elle est vraiment visible avant de t\'afficher quoi que ce soit. L\'infobulle choisit son côté, ne sort jamais de l\'écran et ne se pose jamais sur ce qu\'elle désigne.',
        'Nouveau dans la visite : les sets complets et la rareté Éternel, la page Compte, et l\'ajout rapide. Chaque étape qui demande un geste offre aussi une porte de sortie — personne ne reste coincé.',
      ],
      es: [
        'La visita guiada se rehace en cinco capítulos, uno por página, en el orden de las pestañas. Siempre sabes en qué capítulo estás, cuántos pasos quedan, y puedes saltarte un capítulo entero o salir cuando quieras.',
        'Se acabó la pantalla gris en la que no sabes dónde mirar: cada paso trae su objetivo a la vista por sí solo y comprueba que de verdad se ve antes de mostrarte nada. El globo elige su lado, nunca se sale de la pantalla y nunca se pone encima de lo que señala.',
        'Nuevo en la visita: los sets completos y la rareza Eterno, la página Cuenta y el añadido rápido. Cada paso que pide un gesto ofrece también una salida — nadie se queda atascado.',
      ],
      zh: [
        '导览重做为五个章节,每页一章,顺序与底部标签一致。你随时知道自己在第几章、还剩几步,也可以跳过整章或随时退出。',
        '不会再对着灰屏找不到重点:每一步都会自动把目标滚入视野,并在显示之前确认它真的可见。提示气泡自己选择方位,绝不跑出屏幕,也绝不压在它所指的东西上面。',
        '导览新增内容:整套收齐与「永恒」稀有度、账户页,以及快速添加。每个需要你动手的步骤都留了出口——没有人会被卡住。',
      ],
      it: [
        'La visita guidata è rifatta in cinque capitoli, uno per pagina, nell\'ordine delle schede. Sai sempre in quale capitolo sei, quanti passi restano, e puoi saltare un capitolo intero o uscire quando vuoi.',
        'Basta schermate grigie in cui non sai dove guardare: ogni passo porta da solo il bersaglio in vista e verifica che sia davvero visibile prima di mostrarti qualcosa. Il fumetto sceglie il suo lato, non esce mai dallo schermo e non si posa mai su ciò che indica.',
        'Novità nella visita: i set completi e la rarità Eterno, la pagina Account e l\'aggiunta rapida. Ogni passo che chiede un gesto offre anche una via d\'uscita — nessuno resta bloccato.',
      ],
      nl: [
        'De rondleiding is herbouwd als vijf hoofdstukken, één per pagina, in de volgorde van de tabbladen. Je weet altijd in welk hoofdstuk je zit, hoeveel stappen er nog komen, en je kunt een heel hoofdstuk overslaan of op elk moment stoppen.',
        'Geen grijs scherm meer waarop je zoekt waar je moet kijken: elke stap haalt zijn doel zelf in beeld en controleert of het echt zichtbaar is voordat er iets verschijnt. De ballon kiest zijn eigen kant, loopt nooit van het scherm en gaat nooit bovenop wat hij aanwijst.',
        'Nieuw in de rondleiding: complete sets en de zeldzaamheid Eeuwig, de pagina Account, en snel toevoegen. Elke stap die om een handeling vraagt biedt ook een uitweg — niemand komt vast te zitten.',
      ],
      de: [
        'Die Tour ist als fünf Kapitel neu gebaut, eins pro Seite, in der Reihenfolge der Tabs. Du weißt immer, in welchem Kapitel du bist, wie viele Schritte bleiben, und kannst ein ganzes Kapitel überspringen oder jederzeit aussteigen.',
        'Kein abgedunkelter Bildschirm mehr, auf dem man sucht, wo man hinschauen soll: Jeder Schritt holt sein Ziel selbst ins Bild und prüft, ob es wirklich sichtbar ist, bevor überhaupt etwas erscheint. Die Sprechblase wählt ihre Seite, verlässt nie den Bildschirm und legt sich nie auf das, worauf sie zeigt.',
        'Neu in der Tour: vollständige Sets und die Seltenheit Ewig, die Kontoseite und das schnelle Hinzufügen. Jeder Schritt, der eine Handlung verlangt, bietet auch einen Ausweg — niemand bleibt stecken.',
      ],
    },
  },
  {
    version: '1.46.1',
    date: '2026-08-09',
    changes: {
      en: [
        'Nitro cards look right again: the light that reveals their grid is a beam with soft edges instead of a hard panel, the grid is finer, and its violet is back — nitro no longer gets mistaken for wild.',
      ],
      fr: [
        'Les cartes nitro retrouvent leur allure : la lumière qui révèle leur grille est un rai aux bords fondus et non plus un panneau à bords francs, la trame est plus fine, et son violet est revenu — on ne confond plus nitro et wild.',
      ],
      es: [
        'Las cartas nitro recuperan su aspecto: la luz que revela su rejilla es un haz de bordes suaves en vez de un panel de bordes duros, la trama es más fina y su violeta ha vuelto — ya no se confunde nitro con wild.',
      ],
      zh: [
        '硝速卡恢复了应有的样子:揭示网格的那道光变成边缘柔和的光束,不再是硬边色块;网格更细,紫色也回来了——不会再把硝速卡认成万能卡。',
      ],
      it: [
        'Le carte nitro ritrovano il loro aspetto: la luce che rivela la griglia è un raggio dai bordi sfumati invece di un pannello dai bordi netti, la trama è più fine e il suo viola è tornato — nitro non si confonde più con wild.',
      ],
      nl: [
        'Nitrokaarten zien er weer uit zoals het hoort: het licht dat hun raster onthult is een straal met zachte randen in plaats van een hard vlak, het raster is fijner en het paars is terug — nitro wordt niet meer voor wild aangezien.',
      ],
      de: [
        'Nitro-Karten sehen wieder richtig aus: Das Licht, das ihr Gitter enthüllt, ist ein Strahl mit weichen Rändern statt einer hartkantigen Fläche, das Gitter ist feiner, und sein Violett ist zurück — Nitro wird nicht mehr mit Wild verwechselt.',
      ],
    },
  },
  {
    version: '1.46.0',
    date: '2026-08-09',
    changes: {
      en: [
        'Foil cards are calmer. The shine is softer and, above all, it now passes and then rests instead of sweeping non-stop — on a screen full of cards, your eye gets a break. Every foil stays recognisable at a glance, and the five kinds still tell each other apart.',
        'Under the hood the effects were rebuilt to cost far less: nothing repaints continuously any more, and cards scrolled out of view stop animating altogether. Better for your battery. If your device asks for reduced motion, everything freezes with the shine left across the card, so foils are still obvious.',
      ],
      fr: [
        'Les cartes foil sont plus calmes. Le reflet est plus doux et surtout il passe puis se repose, au lieu de balayer sans arrêt — sur un écran plein de cartes, l\'œil souffle. Chaque foil reste reconnaissable au premier regard, et les cinq sortes se distinguent toujours entre elles.',
        'Sous le capot, les effets ont été refaits pour coûter bien moins cher : plus rien ne se repeint en continu, et les cartes sorties de l\'écran cessent complètement de s\'animer. Ta batterie te remercie. Si ton appareil demande à réduire les animations, tout se fige avec le reflet posé en travers de la carte : les foils restent évidents.',
      ],
      es: [
        'Las cartas foil son más tranquilas. El brillo es más suave y, sobre todo, pasa y luego descansa en vez de barrer sin parar — con la pantalla llena de cartas, la vista respira. Cada foil sigue siendo reconocible de un vistazo y los cinco tipos se distinguen entre sí.',
        'Por dentro, los efectos se rehicieron para costar mucho menos: ya nada se repinta continuamente y las cartas fuera de pantalla dejan de animarse. Tu batería lo agradece. Si tu dispositivo pide reducir el movimiento, todo se congela con el brillo cruzado sobre la carta: los foils siguen siendo evidentes.',
      ],
      zh: [
        '闪卡变得更安静了。反光更柔和,更重要的是它掠过之后会停下来休息,不再持续扫动——满屏卡牌时,眼睛终于能喘口气。每张闪卡依然一眼可辨,五种闪卡也仍然彼此区分得清。',
        '底层重写了这些效果,开销大幅下降:不再有任何元素持续重绘,滚出屏幕的卡牌会完全停止动画,更省电。若你的设备要求减少动态效果,一切会静止,反光则停留在卡面上——闪卡依旧一目了然。',
      ],
      it: [
        'Le carte foil sono più tranquille. Il riflesso è più morbido e soprattutto passa e poi riposa, invece di scorrere senza sosta — con lo schermo pieno di carte, l\'occhio respira. Ogni foil resta riconoscibile al primo sguardo e i cinque tipi si distinguono ancora tra loro.',
        'Sotto il cofano gli effetti sono stati rifatti per costare molto meno: nulla viene più ridipinto di continuo e le carte uscite dallo schermo smettono del tutto di animarsi. La batteria ringrazia. Se il dispositivo chiede di ridurre le animazioni, tutto si congela con il riflesso posato sulla carta: i foil restano evidenti.',
      ],
      nl: [
        'Foilkaarten zijn rustiger. De glans is zachter en gaat vooral voorbij en rust dan, in plaats van onophoudelijk te vegen — bij een scherm vol kaarten krijgt je oog even lucht. Elke foil blijft in één oogopslag herkenbaar en de vijf soorten zijn nog steeds uit elkaar te houden.',
        'Onder de motorkap zijn de effecten herbouwd zodat ze veel minder kosten: niets wordt nog doorlopend hertekend, en kaarten buiten beeld stoppen volledig met animeren. Fijn voor je batterij. Vraagt je toestel om minder beweging, dan bevriest alles met de glans dwars over de kaart: foils blijven duidelijk.',
      ],
      de: [
        'Foil-Karten sind ruhiger. Der Glanz ist weicher und zieht vor allem vorbei und ruht dann, statt ununterbrochen zu wandern — bei einem Bildschirm voller Karten kommt das Auge zur Ruhe. Jede Foil bleibt auf den ersten Blick erkennbar, und die fünf Arten sind weiterhin voneinander zu unterscheiden.',
        'Unter der Haube wurden die Effekte neu gebaut und kosten deutlich weniger: nichts wird mehr dauerhaft neu gezeichnet, und Karten außerhalb des Bildschirms hören ganz auf zu animieren. Gut für den Akku. Verlangt dein Gerät weniger Bewegung, friert alles ein — mit dem Glanz quer über der Karte, damit Foils klar erkennbar bleiben.',
      ],
    },
  },
  {
    version: '1.45.0',
    date: '2026-08-09',
    changes: {
      en: [
        'Every page now opens the same way: an icon, a title and one line telling you where you stand. Nothing was removed — the badge ring and the progress bar simply found their place inside it.',
        'The Stats page fills the screen at last: one main column for the story, and a sidebar that keeps the rarity chart, your highlights and your near goals in view while you scroll. On a wide screen it is three times shorter.',
      ],
      fr: [
        'Chaque page s\'ouvre désormais de la même façon : une icône, un titre, et une ligne qui dit où tu en es. Rien n\'a été supprimé — l\'anneau des badges et la barre de progression y ont simplement trouvé leur place.',
        'La page Stats occupe enfin l\'écran : une colonne principale pour le récit, et une colonne latérale qui garde la répartition par rareté, tes cartes phares et tes objectifs proches sous les yeux pendant que tu fais défiler. Sur grand écran, elle est trois fois plus courte.',
      ],
      es: [
        'Todas las páginas empiezan ahora igual: un icono, un título y una línea que dice cómo vas. No se ha quitado nada — el anillo de insignias y la barra de progreso simplemente han encontrado su sitio dentro.',
        'La página de estadísticas por fin ocupa la pantalla: una columna principal para el relato y una lateral que mantiene a la vista el gráfico de rarezas, tus cartas destacadas y tus objetivos cercanos mientras te desplazas. En pantalla ancha es tres veces más corta.',
      ],
      zh: [
        '每个页面现在都以同样的方式开场:一个图标、一个标题,以及一行说明你的进度。没有任何内容被删除——徽章圆环和进度条只是找到了各自的位置。',
        '统计页终于用满了屏幕:主栏承载主线,侧栏在你滚动时始终显示稀有度分布、精选卡牌和临近目标。在宽屏上,页面长度缩短为原来的三分之一。',
      ],
      it: [
        'Ogni pagina ora si apre allo stesso modo: un\'icona, un titolo e una riga che dice a che punto sei. Non è stato tolto nulla — l\'anello dei distintivi e la barra di avanzamento hanno semplicemente trovato posto lì dentro.',
        'La pagina Statistiche occupa finalmente lo schermo: una colonna principale per il racconto e una laterale che tiene sott\'occhio la ripartizione per rarità, le carte in evidenza e gli obiettivi vicini mentre scorri. Su schermo largo è tre volte più corta.',
      ],
      nl: [
        'Elke pagina begint nu op dezelfde manier: een pictogram, een titel en één regel die zegt waar je staat. Er is niets verdwenen — de badgering en de voortgangsbalk hebben er gewoon hun plek gevonden.',
        'De statistiekenpagina vult eindelijk het scherm: een hoofdkolom voor het verhaal en een zijkolom die de zeldzaamheidsverdeling, je uitgelichte kaarten en je nabije doelen in beeld houdt terwijl je scrolt. Op een breed scherm is de pagina drie keer korter.',
      ],
      de: [
        'Jede Seite beginnt jetzt gleich: ein Symbol, ein Titel und eine Zeile, die sagt, wo du stehst. Nichts wurde entfernt — der Abzeichen-Ring und der Fortschrittsbalken haben darin einfach ihren Platz gefunden.',
        'Die Statistikseite füllt endlich den Bildschirm: eine Hauptspalte für den Verlauf und eine Seitenspalte, die Seltenheitsverteilung, deine Highlights und deine nahen Ziele beim Scrollen im Blick behält. Auf breitem Bildschirm ist sie dreimal kürzer.',
      ],
    },
  },
  {
    version: '1.44.0',
    date: '2026-08-08',
    changes: {
      en: [
        'The bar above the grid is gone, and with it the sort switch and Pack mode. The grid goes back to card order and starts right under the header — more cards visible, less to read before you get to them. Your collection, badges and backups are untouched.',
      ],
      fr: [
        'La barre au-dessus de la grille disparaît, et avec elle le tri et le mode pochette. La grille reprend l\'ordre par numéro de carte et commence juste sous l\'en-tête — plus de cartes visibles, moins à lire avant d\'y arriver. Ta collection, tes badges et tes sauvegardes sont intacts.',
      ],
      es: [
        'La barra encima de la cuadrícula desaparece, y con ella el orden y el modo sobre. La cuadrícula vuelve al orden por número de carta y empieza justo bajo la cabecera — más cartas visibles, menos que leer antes de llegar. Tu colección, insignias y copias quedan intactas.',
      ],
      zh: [
        '网格上方的工具栏已移除,排序切换和开包模式一并取消。网格恢复按卡号排列,并紧贴页首开始——可见卡片更多,阅读干扰更少。你的收藏、徽章和备份不受影响。',
      ],
      it: [
        'La barra sopra la griglia sparisce, e con lei l\'ordinamento e la modalità bustina. La griglia torna all\'ordine per numero di carta e inizia subito sotto l\'intestazione — più carte visibili, meno da leggere prima di arrivarci. Collezione, badge e backup restano intatti.',
      ],
      nl: [
        'De balk boven het raster verdwijnt, en daarmee de sortering en de zakje-modus. Het raster keert terug naar kaartnummervolgorde en begint direct onder de header — meer kaarten zichtbaar, minder te lezen voordat je er bent. Je collectie, badges en back-ups blijven ongemoeid.',
      ],
      de: [
        'Die Leiste über dem Raster verschwindet, und mit ihr die Sortierung und der Päckchen-Modus. Das Raster kehrt zur Kartennummern-Reihenfolge zurück und beginnt direkt unter der Kopfzeile — mehr Karten sichtbar, weniger zu lesen davor. Sammlung, Abzeichen und Backups bleiben unangetastet.',
      ],
    },
  },
  {
    version: '1.43.0',
    date: '2026-08-08',
    changes: {
      en: [
        'The whole app is now usable with a keyboard. Card tiles could not be reached or opened without a mouse — the app\'s main action. They are now proper buttons: Tab reaches them, Enter or Space opens the card sheet, and the wishlist and favourite chips toggle the same way, announcing their on/off state to screen readers. Your focus even stays put after a toggle, so you can keep going without tabbing back.',
      ],
      fr: [
        'Toute l\'app s\'utilise désormais au clavier. Les tuiles de carte étaient inatteignables sans souris — alors que les ouvrir est l\'action principale. Ce sont maintenant de vrais boutons : Tab les atteint, Entrée ou Espace ouvre la fiche, et les puces wishlist et favori basculent pareil en annonçant leur état aux lecteurs d\'écran. Le focus reste même en place après une bascule, pour enchaîner sans re-tabuler.',
      ],
      es: [
        'Toda la app se usa ahora con teclado. Las cartas no se podían alcanzar ni abrir sin ratón — siendo la acción principal. Ahora son botones de verdad: Tab las alcanza, Enter o Espacio abre la ficha, y las marcas de lista de deseos y favoritos alternan igual, anunciando su estado a los lectores de pantalla. El foco se mantiene tras alternar.',
      ],
      zh: [
        '整个应用现已支持键盘操作。此前没有鼠标就无法选中或打开卡片——而这正是应用的主要动作。现在卡片是真正的按钮:Tab 可聚焦,回车或空格打开卡片详情,愿望清单与收藏标记同样支持,并向屏幕阅读器播报开关状态。切换后焦点还会保持原位,无需重新 Tab。',
      ],
      it: [
        'Tutta l\'app è ora utilizzabile da tastiera. Le carte non erano raggiungibili né apribili senza mouse — pur essendo l\'azione principale. Ora sono veri pulsanti: Tab le raggiunge, Invio o Spazio apre la scheda, e i segni wishlist e preferiti si attivano allo stesso modo, annunciando il loro stato agli screen reader. Il focus resta al suo posto dopo un cambio.',
      ],
      nl: [
        'De hele app is nu met een toetsenbord te bedienen. Kaarttegels waren zonder muis niet bereikbaar of te openen — terwijl dat de hoofdactie is. Het zijn nu echte knoppen: Tab bereikt ze, Enter of spatie opent de kaartfiche, en de wishlist- en favorietenmarkeringen schakelen net zo, met hun aan/uit-status voor schermlezers. De focus blijft staan na het schakelen.',
      ],
      de: [
        'Die ganze App ist jetzt mit Tastatur bedienbar. Kartenkacheln waren ohne Maus weder erreichbar noch zu öffnen — obwohl das die Hauptaktion ist. Sie sind jetzt echte Schaltflächen: Tab erreicht sie, Enter oder Leertaste öffnet das Kartenblatt, und die Wunschlisten- und Favoriten-Marken schalten genauso, samt An/Aus-Status für Screenreader. Der Fokus bleibt nach dem Umschalten stehen.',
      ],
    },
  },
  {
    version: '1.42.2',
    date: '2026-08-08',
    changes: {
      en: [
        'Security fix: a shared backup — a code, a QR, or a link — could carry hidden code that ran when the import dialog opened, with access to everything this app stores on your device. Every value coming from outside is now neutralised before display, on all four import paths (file, code, link, cloud). Update if you ever open backups you did not create yourself.',
      ],
      fr: [
        'Correctif de sécurité : une sauvegarde partagée — un code, un QR ou un lien — pouvait transporter du code caché qui s\'exécutait à l\'ouverture de la fenêtre d\'import, avec accès à tout ce que l\'app garde sur ton appareil. Toute valeur venant de l\'extérieur est désormais neutralisée avant affichage, sur les quatre chemins d\'import (fichier, code, lien, cloud). À installer si tu ouvres des sauvegardes que tu n\'as pas créées toi-même.',
      ],
      es: [
        'Corrección de seguridad: una copia compartida — un código, un QR o un enlace — podía transportar código oculto que se ejecutaba al abrirse el diálogo de importación, con acceso a todo lo que la app guarda en tu dispositivo. Todo valor externo se neutraliza ahora antes de mostrarse, en las cuatro vías de importación (archivo, código, enlace, nube).',
      ],
      zh: [
        '安全修复:他人分享的备份——备份码、二维码或链接——可能夹带隐藏代码,在导入对话框打开时执行,并能访问本应用存储在你设备上的一切。现在所有来自外部的数值在显示前都会被中和,四条导入路径(文件、备份码、链接、云端)均已覆盖。若你会打开非自己创建的备份,请务必更新。',
      ],
      it: [
        'Correzione di sicurezza: un backup condiviso — un codice, un QR o un link — poteva trasportare codice nascosto che veniva eseguito all\'apertura della finestra di importazione, con accesso a tutto ciò che l\'app conserva sul tuo dispositivo. Ogni valore proveniente dall\'esterno è ora neutralizzato prima della visualizzazione, su tutti e quattro i percorsi di importazione.',
      ],
      nl: [
        'Beveiligingsfix: een gedeelde back-up — een code, een QR of een link — kon verborgen code bevatten die werd uitgevoerd zodra het importvenster opende, met toegang tot alles wat de app op je apparaat bewaart. Elke waarde van buitenaf wordt nu onschadelijk gemaakt vóór weergave, op alle vier de importpaden.',
      ],
      de: [
        'Sicherheitskorrektur: ein geteiltes Backup — ein Code, ein QR oder ein Link — konnte verstecken Code enthalten, der beim Öffnen des Import-Dialogs ausgeführt wurde, mit Zugriff auf alles, was die App auf deinem Gerät speichert. Jeder von außen kommende Wert wird jetzt vor der Anzeige unschädlich gemacht, auf allen vier Importwegen.',
      ],
    },
  },
  {
    version: '1.42.1',
    date: '2026-08-08',
    changes: {
      en: ['Documentation only: the READMEs in all 7 languages now cover Pack mode (with an animated demo) and carry the right badge and test counts. Nothing changed in the app itself.'],
      fr: ['Documentation seulement : les README des 7 langues couvrent désormais le mode pochette (avec une démo animée) et portent les bons comptes de badges et de tests. Rien n’a changé dans l’app elle-même.'],
      es: ['Solo documentación: los README de los 7 idiomas ya cubren el modo sobre (con una demo animada) y llevan los recuentos correctos de insignias y tests. Nada cambió en la app.'],
      zh: ['仅文档更新:7 种语言的 README 现已涵盖开包模式(附动画演示),徽章与测试数量也已更正。应用本身没有任何改动。'],
      it: ['Solo documentazione: i README di tutte e 7 le lingue ora coprono la modalità bustina (con una demo animata) e riportano i conteggi corretti di badge e test. Nulla è cambiato nell’app.'],
      nl: ['Alleen documentatie: de README’s in alle 7 talen behandelen nu de zakje-modus (met een geanimeerde demo) en bevatten de juiste badge- en testaantallen. In de app zelf is niets veranderd.'],
      de: ['Nur Dokumentation: die READMEs in allen 7 Sprachen decken jetzt den Päckchen-Modus ab (mit animierter Demo) und tragen die korrekten Abzeichen- und Testzahlen. In der App selbst hat sich nichts geändert.'],
    },
  },
  {
    version: '1.42.0',
    date: '2026-08-08',
    changes: {
      en: [
        'New Pack mode — the feature for opening a booster at the table. One button above the grid opens a full-screen flow: type the card number on the big keypad, it is recognised at the third digit, and one large button adds a copy (with a haptic tap). "Variant…" picks a specific type, "Skip" moves on.',
        'Nothing can go wrong: every action is listed at the top and can be undone one by one, badges unlocked during the session are held back and delivered together on the summary screen (no burst of toasts), and "Undo everything" restores your collection exactly as it was before you opened the pack.',
      ],
      fr: [
        'Nouveau mode Pochette — la fonction pour ouvrir un booster à table. Un bouton au-dessus de la grille ouvre un flux plein écran : tu tapes le numéro de la carte sur le grand pavé, elle est reconnue dès le 3e chiffre, et un seul gros bouton ajoute un exemplaire (avec un retour haptique). « Variante… » choisit un type précis, « Passer » enchaîne.',
        'Rien ne peut mal tourner : chaque geste s\'affiche en haut et s\'annule un par un, les badges débloqués pendant la session sont retenus et livrés ensemble sur l\'écran de résumé (pas de rafale de notifications), et « Tout annuler » restaure ta collection exactement comme elle était avant l\'ouverture.',
      ],
      es: [
        'Nuevo modo Sobre — la función para abrir un sobre en la mesa. Un botón encima de la cuadrícula abre un flujo a pantalla completa: escribes el número de la carta en el teclado grande, se reconoce en la tercera cifra, y un solo botón grande añade un ejemplar (con respuesta háptica). «Variante…» elige un tipo concreto, «Saltar» continúa.',
        'Nada puede salir mal: cada acción aparece arriba y se deshace una a una, las insignias desbloqueadas durante la sesión se retienen y se entregan juntas en el resumen (sin ráfaga de avisos), y «Deshacer todo» restaura tu colección exactamente como estaba antes de abrir el sobre.',
      ],
      zh: [
        '全新开包模式——为在牌桌上拆包而生。网格上方的按钮打开全屏流程:在大号数字键盘输入卡片编号,满三位即识别,一个大按钮即可添加一张(带触感反馈)。「版本…」可指定具体版本,「跳过」直接进入下一张。',
        '不会出错:每一步都显示在顶部并可逐一撤销;开包期间解锁的徽章会被暂存,在结算页一并呈现(不会连环弹窗);「全部撤销」会把收藏还原成开包前的样子。',
      ],
      it: [
        'Nuova modalità Bustina — la funzione per aprire un pacchetto al tavolo. Un pulsante sopra la griglia apre un flusso a schermo intero: digiti il numero della carta sul tastierino grande, viene riconosciuta alla terza cifra, e un solo grande pulsante aggiunge un esemplare (con risposta aptica). «Variante…» sceglie un tipo preciso, «Salta» prosegue.',
        'Niente può andare storto: ogni gesto compare in alto e si annulla uno per uno, i badge sbloccati durante la sessione vengono trattenuti e consegnati insieme nel riepilogo (nessuna raffica di notifiche), e «Annulla tutto» ripristina la collezione esattamente com\'era prima di aprire la bustina.',
      ],
      nl: [
        'Nieuwe Zakje-modus — de functie om aan tafel een boosterpakje te openen. Eén knop boven het raster opent een schermvullende flow: je typt het kaartnummer op het grote toetsenblok, bij het derde cijfer wordt de kaart herkend, en één grote knop voegt een exemplaar toe (met haptische tik). "Variant…" kiest een specifiek type, "Overslaan" gaat verder.',
        'Er kan niets misgaan: elke handeling staat bovenaan en is één voor één ongedaan te maken, badges die tijdens de sessie vrijkomen worden vastgehouden en samen op het overzicht getoond (geen stortvloed aan meldingen), en "Alles ongedaan maken" zet je collectie exact terug zoals ze was.',
      ],
      de: [
        'Neuer Päckchen-Modus — die Funktion zum Öffnen eines Boosters am Tisch. Ein Knopf über dem Raster öffnet einen Vollbild-Ablauf: du tippst die Kartennummer auf dem großen Ziffernblock, ab der dritten Ziffer wird die Karte erkannt, und ein einziger großer Knopf fügt ein Exemplar hinzu (mit haptischem Impuls). „Variante…" wählt einen bestimmten Typ, „Überspringen" geht weiter.',
        'Nichts kann schiefgehen: jede Aktion steht oben und lässt sich einzeln rückgängig machen, während der Sitzung freigeschaltete Abzeichen werden zurückgehalten und gemeinsam in der Zusammenfassung gezeigt (keine Benachrichtigungssalve), und „Alles rückgängig" stellt deine Sammlung exakt so wieder her, wie sie vorher war.',
      ],
    },
  },
  {
    version: '1.41.1',
    date: '2026-08-08',
    changes: {
      en: ['Documentation only: the full screenshot set was regenerated (the READMEs now show the current tiles, icons and the 120 badges), three animated demos were added to the README, and an "Engineering notes" section documents the technical choices in all 7 languages. Nothing in the app itself changed.'],
      fr: ['Documentation seulement : le jeu complet de captures a été régénéré (les README montrent désormais les tuiles actuelles, les icônes et les 120 badges), trois démos animées rejoignent le README, et une section « Notes d\'ingénierie » documente les choix techniques dans les 7 langues. Rien n\'a changé dans l\'app elle-même.'],
      es: ['Solo documentación: se regeneró el conjunto completo de capturas (los README muestran ya las casillas actuales, los iconos y las 120 insignias), se añadieron tres demos animadas al README y una sección de «Notas de ingeniería» documenta las decisiones técnicas en los 7 idiomas. Nada cambió en la app.'],
      zh: ['仅文档更新:整套截图已重新生成(README 现在展示当前的卡格、图标和 120 枚徽章),README 新增三个动画演示,并新增「工程说明」章节以 7 种语言记录技术决策。应用本身没有任何改动。'],
      it: ['Solo documentazione: l\'intero set di schermate è stato rigenerato (i README mostrano ora le tessere attuali, le icone e i 120 badge), tre demo animate si aggiungono al README e una sezione «Note di ingegneria» documenta le scelte tecniche nelle 7 lingue. Nulla è cambiato nell\'app.'],
      nl: ['Alleen documentatie: de volledige set schermafbeeldingen is opnieuw gegenereerd (de README\'s tonen nu de huidige tegels, iconen en de 120 badges), drie geanimeerde demo\'s zijn aan de README toegevoegd en een sectie "Engineering-notities" documenteert de technische keuzes in alle 7 talen. In de app zelf is niets veranderd.'],
      de: ['Nur Dokumentation: der komplette Screenshot-Satz wurde neu erzeugt (die READMEs zeigen jetzt die aktuellen Kacheln, Icons und die 120 Abzeichen), drei animierte Demos kamen ins README, und ein Abschnitt „Engineering-Notizen" dokumentiert die technischen Entscheidungen in allen 7 Sprachen. In der App selbst hat sich nichts geändert.'],
    },
  },
  {
    version: '1.41.0',
    date: '2026-08-08',
    changes: {
      en: [
        'Stats now motivate: a new "Close goals" block shows what you are closest to finishing — "Finish Williams, 2 to go", "Finish Champions, 3 to go" — sorted by fewest missing. Tap a goal to reveal exactly which cards are missing.',
      ],
      fr: [
        'Les Stats motivent désormais : un nouveau bloc « Objectifs proches » montre ce que tu es le plus près de finir — « Finir Williams, plus que 2 », « Finir Champions, plus que 3 » — trié par manque croissant. Touche un objectif pour révéler exactement quelles cartes manquent.',
      ],
      es: [
        'Las estadísticas ahora motivan: un nuevo bloque «Objetivos cercanos» muestra lo que estás más cerca de terminar — «Terminar Williams, faltan 2», «Terminar Campeones, faltan 3» — ordenado por lo que menos falta. Toca un objetivo para revelar exactamente qué cartas faltan.',
      ],
      zh: [
        '统计页现在更有动力:新的「近在咫尺的目标」板块展示你最接近完成的目标——「集齐 Williams,还差 2 张」「集齐冠军,还差 3 张」——按缺失数量排序。点按目标即可看到具体缺哪些卡。',
      ],
      it: [
        'Le statistiche ora motivano: un nuovo blocco «Obiettivi vicini» mostra ciò che sei più vicino a completare — «Completare Williams, ne mancano 2», «Completare Campioni, ne mancano 3» — ordinato per mancanza crescente. Tocca un obiettivo per rivelare esattamente quali carte mancano.',
      ],
      nl: [
        'Statistieken motiveren nu: een nieuw blok "Bijna-doelen" toont wat je het dichtst bij voltooiing bent — "Williams afronden, nog 2", "Kampioenen afronden, nog 3" — gesorteerd op minste ontbrekend. Tik op een doel om precies te zien welke kaarten ontbreken.',
      ],
      de: [
        'Die Statistiken motivieren jetzt: ein neuer Block „Nahe Ziele" zeigt, was du am ehesten abschließen kannst — „Williams abschließen, noch 2", „Champions abschließen, noch 3" — sortiert nach geringstem Fehlbestand. Tippe auf ein Ziel, um genau zu sehen, welche Karten fehlen.',
      ],
    },
  },
  {
    version: '1.40.0',
    date: '2026-08-08',
    changes: {
      en: [
        'Cloud sync, hardened against real-world networks: a connection drop during a save now says "you are offline" and your session survives — previously, a drop at the wrong moment could silently sign you out. A token revoked server-side now shows the proper "session expired" state and cleans up. In every failure case, your local collection is untouched — verified scenario by scenario.',
      ],
      fr: [
        'Synchronisation cloud endurcie face aux réseaux réels : une coupure pendant une sauvegarde dit désormais « tu es hors-ligne » et ta session survit — avant, une coupure au mauvais moment pouvait te déconnecter silencieusement. Un jeton révoqué côté serveur affiche maintenant le vrai état « session expirée » et nettoie proprement. Dans tous les cas d\'échec, ta collection locale est intouchée — vérifié scénario par scénario.',
      ],
      es: [
        'Sincronización en la nube endurecida frente a redes reales: un corte durante un guardado ahora dice «estás sin conexión» y tu sesión sobrevive — antes, un corte en mal momento podía cerrarte la sesión en silencio. Un token revocado en el servidor muestra ahora el estado correcto de «sesión caducada» y limpia bien. En todos los casos de fallo, tu colección local queda intacta — verificado escenario por escenario.',
      ],
      zh: [
        '云同步在真实网络环境下更加健壮:保存过程中断网现在会提示「你已离线」,且会话得以保留——此前不巧的断网可能悄悄将你登出。服务器端吊销的令牌现在会正确显示「会话已过期」并妥善清理。所有失败情形下,本地收藏都不受影响——逐一场景验证。',
      ],
      it: [
        'Sincronizzazione cloud temprata per le reti reali: un\'interruzione durante un salvataggio ora dice «sei offline» e la tua sessione sopravvive — prima, un\'interruzione al momento sbagliato poteva disconnetterti in silenzio. Un token revocato lato server mostra ora il vero stato «sessione scaduta» e pulisce correttamente. In ogni caso di errore, la collezione locale resta intatta — verificato scenario per scenario.',
      ],
      nl: [
        'Cloudsynchronisatie gehard voor echte netwerken: een verbindingsonderbreking tijdens het opslaan zegt nu "je bent offline" en je sessie overleeft — voorheen kon een onderbreking op het verkeerde moment je stilletjes uitloggen. Een servergezijds ingetrokken token toont nu de juiste "sessie verlopen"-status en ruimt netjes op. In elk foutgeval blijft je lokale collectie onaangetast — scenario voor scenario geverifieerd.',
      ],
      de: [
        'Cloud-Sync gehärtet für echte Netze: ein Verbindungsabbruch während des Speicherns sagt jetzt „du bist offline" und deine Sitzung überlebt — vorher konnte ein Abbruch im falschen Moment still abmelden. Ein serverseitig widerrufenes Token zeigt jetzt den korrekten Zustand „Sitzung abgelaufen" und räumt sauber auf. In jedem Fehlerfall bleibt die lokale Sammlung unberührt — Szenario für Szenario geprüft.',
      ],
    },
  },
  {
    version: '1.39.0',
    date: '2026-08-08',
    changes: {
      en: [
        'New sort above the grid: "Card number" or "Missing first" — a discreet two-state switch, remembered on your device.',
        'If you skipped the guided tour, a small one-time bubble now points at the + button the first time you see the grid — dismiss it, or it disappears by itself on your first quick add.',
      ],
      fr: [
        'Nouveau tri au-dessus de la grille : « N° de carte » ou « Manquantes d\'abord » — un interrupteur discret à deux états, mémorisé sur ton appareil.',
        'Si tu as sauté la visite guidée, une petite bulle unique pointe désormais le bouton + à ta première grille — ferme-la, ou elle disparaît d\'elle-même à ton premier ajout rapide.',
      ],
      es: [
        'Nuevo orden encima de la cuadrícula: «N.º de carta» o «Faltantes primero» — un conmutador discreto de dos estados, recordado en tu dispositivo.',
        'Si te saltaste la visita guiada, una pequeña burbuja única señala ahora el botón + la primera vez que ves la cuadrícula — ciérrala, o desaparece sola con tu primer añadido rápido.',
      ],
      zh: [
        '网格上方新增排序:「按编号」或「缺失优先」——低调的双态开关,记忆在你的设备上。',
        '如果你跳过了引导教程,第一次看到网格时会有一个一次性小气泡指向 + 按钮——可以关闭,或在你第一次快速添加时自动消失。',
      ],
      it: [
        'Nuovo ordinamento sopra la griglia: «N. carta» o «Mancanti prima» — un interruttore discreto a due stati, ricordato sul tuo dispositivo.',
        'Se hai saltato il tour guidato, una piccola bolla unica indica ora il pulsante + alla tua prima griglia — chiudila, o sparisce da sola al tuo primo aggiunta rapida.',
      ],
      nl: [
        'Nieuwe sortering boven het raster: "Kaartnummer" of "Ontbrekende eerst" — een discrete tweestandenschakelaar, onthouden op je apparaat.',
        'Als je de rondleiding oversloeg, wijst nu een klein eenmalig tekstballonnetje naar de +-knop bij je eerste raster — sluit het, of het verdwijnt vanzelf bij je eerste snelle toevoeging.',
      ],
      de: [
        'Neue Sortierung über dem Raster: „Kartennummer" oder „Fehlende zuerst" — ein dezenter Zwei-Zustands-Schalter, auf deinem Gerät gemerkt.',
        'Wer die geführte Tour übersprungen hat, bekommt beim ersten Raster eine kleine einmalige Blase am +-Knopf — schließbar, oder sie verschwindet von selbst beim ersten schnellen Hinzufügen.',
      ],
    },
  },
  {
    version: '1.38.1',
    date: '2026-08-08',
    changes: {
      en: ['Fixed: some titles from the new badges showed their internal key (like "title.foil_15") instead of their name in the header and the title picker.'],
      fr: ['Corrigé : certains titres issus des nouveaux badges affichaient leur clé interne (du genre « title.foil_15 ») au lieu de leur nom dans le header et le sélecteur de titre.'],
      es: ['Corregido: algunos títulos de las nuevas insignias mostraban su clave interna (tipo «title.foil_15») en lugar de su nombre en la cabecera y el selector de título.'],
      zh: ['修复:部分来自新徽章的称号在页首和称号选择器中显示内部键名(如「title.foil_15」)而非名称。'],
      it: ['Corretto: alcuni titoli dei nuovi badge mostravano la loro chiave interna (tipo «title.foil_15») invece del nome nell\'intestazione e nel selettore di titolo.'],
      nl: ['Opgelost: sommige titels van de nieuwe badges toonden hun interne sleutel (zoals "title.foil_15") in plaats van hun naam in de header en de titelkiezer.'],
      de: ['Behoben: einige Titel der neuen Abzeichen zeigten ihren internen Schlüssel (etwa „title.foil_15") statt ihres Namens in der Kopfzeile und der Titelauswahl.'],
    },
  },
  {
    version: '1.38.0',
    date: '2026-08-08',
    changes: {
      en: [
        'The title picker now shows ALL 120 badges, sorted from hardest to easiest with their difficulty on every row — unlocked ones are selectable, locked ones appear greyed out so you can see what you are aiming for. And every unlocked badge now grants its title, not just a chosen few.',
      ],
      fr: [
        'Le sélecteur de titre affiche désormais LES 120 badges, triés du plus difficile au plus facile avec leur difficulté sur chaque ligne — les débloqués sont sélectionnables, les verrouillés apparaissent grisés pour voir ce qui t\'attend. Et chaque badge débloqué offre désormais son titre, plus seulement quelques élus.',
      ],
      es: [
        'El selector de título muestra ahora LAS 120 insignias, ordenadas de la más difícil a la más fácil con su dificultad en cada línea — las desbloqueadas son seleccionables, las bloqueadas aparecen en gris para ver lo que te espera. Y cada insignia desbloqueada otorga ahora su título, no solo unas pocas elegidas.',
      ],
      zh: [
        '称号选择器现在显示全部 120 枚徽章,按从最难到最易排序,每行都标注难度——已解锁的可以选择,未解锁的以灰色显示,让你看清前方目标。而且每枚已解锁的徽章现在都授予称号,不再只有少数几枚。',
      ],
      it: [
        'Il selettore di titolo mostra ora TUTTI i 120 badge, ordinati dal più difficile al più facile con la difficoltà su ogni riga — gli sbloccati sono selezionabili, i bloccati appaiono in grigio per vedere cosa ti aspetta. E ogni badge sbloccato conferisce ora il suo titolo, non solo pochi eletti.',
      ],
      nl: [
        'De titelkiezer toont nu ALLE 120 badges, gesorteerd van moeilijkst naar makkelijkst met hun moeilijkheid op elke regel — ontgrendelde zijn selecteerbaar, vergrendelde staan grijs zodat je ziet wat je te wachten staat. En elke ontgrendelde badge geeft nu zijn titel, niet slechts een paar uitverkorenen.',
      ],
      de: [
        'Die Titelauswahl zeigt jetzt ALLE 120 Abzeichen, sortiert vom schwersten zum leichtesten mit ihrer Schwierigkeit in jeder Zeile — freigeschaltete sind wählbar, gesperrte erscheinen ausgegraut, damit man sieht, was einen erwartet. Und jedes freigeschaltete Abzeichen verleiht jetzt seinen Titel, nicht mehr nur wenige Auserwählte.',
      ],
    },
  },
  {
    version: '1.37.0',
    date: '2026-08-08',
    changes: {
      en: [
        'A round 120: nine new Foils & rarities badges — foil milestones (15, 30), duals, wilds, nitros, promos, Divine (1, 3) and Cosmic (5).',
        'The difficulty indicator now sits on every badge tile (coloured percentage), not just in the detail.',
        'Fixed: the "Promo king" badge could never unlock — its filter counted a card type that does not exist. It now counts all four promos, and if you already own one, it unlocks silently on launch.',
      ],
      fr: [
        'Un compte rond de 120 : neuf nouveaux badges Foils & raretés — jalons de foils (15, 30), duals, wild, nitro, promos, Divin (1, 3) et Cosmique (5).',
        'L\'indicateur de difficulté s\'affiche désormais sur chaque tuile de badge (pourcentage coloré), pas seulement dans le détail.',
        'Corrigé : le badge « Promo king » ne pouvait jamais se débloquer — son filtre comptait un type de carte inexistant. Il compte désormais les quatre promos, et si tu en possèdes déjà une, il se débloque silencieusement au lancement.',
      ],
      es: [
        'Un total redondo de 120: nueve nuevas insignias de Foils y rarezas — hitos de foils (15, 30), duales, wild, nitro, promos, Divina (1, 3) y Cósmica (5).',
        'El indicador de dificultad aparece ahora en cada casilla de insignia (porcentaje coloreado), no solo en el detalle.',
        'Corregido: la insignia «Promo king» nunca podía desbloquearse — su filtro contaba un tipo de carta inexistente. Ahora cuenta las cuatro promos, y si ya tienes una, se desbloquea en silencio al arrancar.',
      ],
      zh: [
        '凑成整数 120:新增九枚闪卡与稀有度徽章——闪卡里程碑(15、30)、双色、Wild、Nitro、Promo、神圣(1、3)和宇宙(5)。',
        '难度指示现在显示在每一块徽章卡格上(彩色百分比),不再只在详情里。',
        '修复:「Promo king」徽章从未能解锁——它的筛选器统计的是一个不存在的卡片类型。现在统计全部四种 Promo;若你已拥有,启动时会静默解锁。',
      ],
      it: [
        'Un totale tondo di 120: nove nuovi badge Foil e rarità — traguardi di foil (15, 30), dual, wild, nitro, promo, Divino (1, 3) e Cosmico (5).',
        'L\'indicatore di difficoltà appare ora su ogni tessera di badge (percentuale colorata), non solo nel dettaglio.',
        'Corretto: il badge «Promo king» non poteva mai sbloccarsi — il suo filtro contava un tipo di carta inesistente. Ora conta le quattro promo, e se ne possiedi già una si sblocca in silenzio all\'avvio.',
      ],
      nl: [
        'Een rond totaal van 120: negen nieuwe Foils & zeldzaamheden-badges — foilmijlpalen (15, 30), duals, wilds, nitro\'s, promo\'s, Goddelijk (1, 3) en Kosmisch (5).',
        'De moeilijkheidsindicator staat nu op elke badgetegel (gekleurd percentage), niet alleen in het detail.',
        'Opgelost: de badge «Promo king» kon nooit ontgrendelen — zijn filter telde een niet-bestaand kaarttype. Hij telt nu alle vier promo\'s, en als je er al één bezit, ontgrendelt hij stil bij het opstarten.',
      ],
      de: [
        'Eine runde 120: neun neue Foils-&-Seltenheiten-Abzeichen — Foil-Meilensteine (15, 30), Duals, Wilds, Nitros, Promos, Göttlich (1, 3) und Kosmisch (5).',
        'Der Schwierigkeitsindikator sitzt jetzt auf jeder Abzeichen-Kachel (farbige Prozentzahl), nicht nur im Detail.',
        'Behoben: das Abzeichen „Promo king" konnte nie freigeschaltet werden — sein Filter zählte einen nicht existierenden Kartentyp. Jetzt zählt es alle vier Promos, und wer schon eine besitzt, bekommt es beim Start still freigeschaltet.',
      ],
    },
  },
  {
    version: '1.36.0',
    date: '2026-08-08',
    changes: {
      en: [
        'The badge system grows from 50 to 111: full-set milestones, Eternal counts, a whole new Teams family (own a team, complete a team — up to the Grand Slam: every team in full set, the absolute summit), perfect categories, doubles, copies and rhythm badges, plus 27 new real-world experiences to self-validate.',
        'Every badge now carries an intrinsic difficulty score (0–100) with a quality label, computed from the real effort it demands — shown in the badge detail, and the hero\'s "hardest badge" now uses it.',
        'Fair to veterans: on first launch, badges you had already earned unlock silently as "Unlocked" without a fake date — no toast storm, no rewritten history.',
      ],
      fr: [
        'Le système de badges passe de 50 à 111 : jalons de sets intégraux, comptes d\'Éternels, une famille Écuries entière (posséder une écurie, la compléter — jusqu\'au Grand Chelem : toutes les écuries en set intégral, le sommet absolu), catégories parfaites, doubles, exemplaires et badges de rythme, plus 27 nouvelles expériences vécues à valider soi-même.',
        'Chaque badge porte désormais un score de difficulté intrinsèque (0–100) avec un libellé qualitatif, calculé depuis l\'effort réel qu\'il exige — affiché dans le détail du badge, et le « badge le plus difficile » du hero l\'utilise désormais.',
        'Loyal envers les anciens : au premier lancement, les badges que tu avais déjà mérités se débloquent silencieusement en « Débloqué » sans fausse date — pas de rafale de toasts, pas d\'histoire réécrite.',
      ],
      es: [
        'El sistema de insignias pasa de 50 a 111: hitos de sets íntegros, recuentos de Eternas, toda una familia de Escuderías (poseer una escudería, completarla — hasta el Grand Slam: todas las escuderías en set íntegro, la cima absoluta), categorías perfectas, dobles, copias e insignias de ritmo, más 27 nuevas experiencias reales que validar uno mismo.',
        'Cada insignia lleva ahora una puntuación de dificultad intrínseca (0–100) con etiqueta cualitativa, calculada desde el esfuerzo real que exige — visible en el detalle, y la «insignia más difícil» del héroe ahora la usa.',
        'Justo con los veteranos: en el primer arranque, las insignias que ya habías ganado se desbloquean en silencio como «Desbloqueada» sin fecha falsa — sin ráfaga de avisos, sin reescribir la historia.',
      ],
      zh: [
        '徽章系统从 50 枚扩展到 111 枚:全套里程碑、永恒计数、全新的车队家族(拥有一支车队、集齐一支车队——直至大满贯:所有车队全部集齐,系统的最高峰)、完美类别、重复卡、副本与节奏徽章,外加 27 个可自行确认的真实经历徽章。',
        '每枚徽章现在都有一个内在难度分(0–100)和等级标签,由其实际所需的努力计算得出——显示在徽章详情中,页首的「最难徽章」也改用该分数。',
        '对老玩家公平:首次启动时,你早已达成的徽章会静默解锁为「已解锁」且不带虚假日期——没有提示轰炸,不改写历史。',
      ],
      it: [
        'Il sistema di badge passa da 50 a 111: traguardi di set integrali, conteggi di Eterni, un\'intera famiglia Scuderie (possedere una scuderia, completarla — fino al Grande Slam: tutte le scuderie in set integrale, la vetta assoluta), categorie perfette, doppie, esemplari e badge di ritmo, più 27 nuove esperienze reali da auto-validare.',
        'Ogni badge porta ora un punteggio di difficoltà intrinseca (0–100) con etichetta qualitativa, calcolato dallo sforzo reale che richiede — mostrato nel dettaglio, e il «badge più difficile» dell\'hero ora lo usa.',
        'Giusto con i veterani: al primo avvio, i badge già meritati si sbloccano in silenzio come «Sbloccato» senza data falsa — niente raffica di toast, niente storia riscritta.',
      ],
      nl: [
        'Het badgesysteem groeit van 50 naar 111: mijlpalen voor volledige sets, Eeuwig-tellingen, een hele nieuwe Teams-familie (een team bezitten, een team voltooien — tot aan de Grand Slam: elk team in volledig set, de absolute top), perfecte categorieën, dubbelen, exemplaren en ritmebadges, plus 27 nieuwe echte ervaringen om zelf af te vinken.',
        'Elke badge draagt nu een intrinsieke moeilijkheidsscore (0–100) met kwaliteitslabel, berekend uit de echte inspanning die hij vraagt — zichtbaar in het detail, en de «moeilijkste badge» van de hero gebruikt hem nu.',
        'Eerlijk voor veteranen: bij de eerste start worden badges die je al verdiend had stil ontgrendeld als «Ontgrendeld» zonder valse datum — geen toast-regen, geen herschreven geschiedenis.',
      ],
      de: [
        'Das Abzeichensystem wächst von 50 auf 111: Komplett-Set-Meilensteine, Ewig-Zählungen, eine ganze Team-Familie (ein Team besitzen, ein Team vervollständigen — bis zum Grand Slam: jedes Team im kompletten Set, der absolute Gipfel), perfekte Kategorien, Doppelte, Exemplare und Rhythmus-Abzeichen, plus 27 neue echte Erlebnisse zum Selbstbestätigen.',
        'Jedes Abzeichen trägt jetzt einen intrinsischen Schwierigkeitswert (0–100) mit Qualitätslabel, berechnet aus dem realen Aufwand — sichtbar im Detail, und das „schwerste Abzeichen" des Heros nutzt ihn jetzt.',
        'Fair zu Veteranen: beim ersten Start werden bereits verdiente Abzeichen still als „Freigeschaltet" ohne falsches Datum entsperrt — kein Toast-Gewitter, keine umgeschriebene Geschichte.',
      ],
    },
  },
  {
    version: '1.35.0',
    date: '2026-08-08',
    changes: {
      en: [
        'Light theme, full accessibility pass: every screen was scanned text-by-text against WCAG AA. Secondary greys are deeper, coloured inks (titles, rarity labels in stats, active season pill, nav label, danger button, Badges ladder) automatically darken on light backgrounds. Dark theme is untouched.',
      ],
      fr: [
        'Thème clair, passe d\'accessibilité complète : chaque écran a été scanné texte par texte contre WCAG AA. Les gris secondaires sont plus profonds, les encres colorées (titres, libellés de rareté des stats, pilule de saison active, libellé de navigation, bouton danger, échelle des Badges) s\'assombrissent automatiquement sur fond clair. Le thème sombre ne bouge pas.',
      ],
      es: [
        'Tema claro, pasada completa de accesibilidad: cada pantalla se escaneó texto a texto contra WCAG AA. Los grises secundarios son más profundos y las tintas de color (títulos, etiquetas de rareza en estadísticas, píldora de temporada activa, etiqueta de navegación, botón de peligro, escalera de Insignias) se oscurecen automáticamente sobre fondo claro. El tema oscuro no cambia.',
      ],
      zh: [
        '浅色主题完成完整的可访问性检查:每个界面都逐条文本对照 WCAG AA 扫描。次级灰色更深,彩色文字(标题、统计中的稀有度标签、当前赛季胶囊、导航标签、危险按钮、徽章阶梯)在浅色背景上自动加深。深色主题保持不变。',
      ],
      it: [
        'Tema chiaro, passata completa di accessibilità: ogni schermata è stata scansionata testo per testo contro WCAG AA. I grigi secondari sono più profondi e gli inchiostri colorati (titoli, etichette di rarità nelle statistiche, pillola della stagione attiva, etichetta di navigazione, pulsante di pericolo, scala dei Badge) si scuriscono automaticamente su fondo chiaro. Il tema scuro non cambia.',
      ],
      nl: [
        'Licht thema, volledige toegankelijkheidsronde: elk scherm is tekst voor tekst gescand tegen WCAG AA. Secundaire grijstinten zijn dieper en gekleurde inkten (titels, zeldzaamheidslabels in statistieken, actieve seizoenspil, navigatielabel, gevarenknop, Badges-ladder) worden automatisch donkerder op lichte achtergronden. Het donkere thema blijft onaangeroerd.',
      ],
      de: [
        'Helles Design, kompletter Barrierefreiheits-Durchgang: jeder Bildschirm wurde Text für Text gegen WCAG AA geprüft. Sekundäre Grautöne sind tiefer, farbige Tinten (Titel, Seltenheits-Labels in den Statistiken, aktive Saison-Pille, Navigations-Label, Gefahren-Knopf, Abzeichen-Leiter) dunkeln auf hellem Grund automatisch nach. Das dunkle Design bleibt unberührt.',
      ],
    },
  },
  {
    version: '1.34.0',
    date: '2026-08-08',
    changes: {
      en: [
        'Variant colours finally show — loud and proud, from the very first base card: the owned colour washes over the card body with a crisp coloured edge (blue, green, red, yellow), and foil, dual and promo bodies become tinted glass in their family colour instead of near-black panels. Rarity keeps the visual background; wild, nitro and Eternal keep their own worlds.',
      ],
      fr: [
        'Les couleurs de variantes se voient enfin — franchement, dès la première carte de base : la couleur possédée lave le corps de la carte avec une arête colorée nette (bleu, vert, rouge, jaune), et les corps foil, dual et promo deviennent un verre teinté à leur couleur de famille au lieu de panneaux presque noirs. La rareté garde le fond du visuel ; wild, nitro et Éternel gardent leurs mondes propres.',
      ],
      es: [
        'Los colores de las variantes por fin se ven — con fuerza, desde la primera carta base: el color poseído baña el cuerpo de la carta con un borde de color nítido (azul, verde, rojo, amarillo), y los cuerpos foil, dual y promo se vuelven un cristal tintado de su color de familia en lugar de paneles casi negros. La rareza conserva el fondo del visual; wild, nitro y Eterno conservan sus propios mundos.',
      ],
      zh: [
        '版本颜色终于醒目可见——从第一张基础卡开始:持有的颜色以清晰的彩色上边线晕染卡片主体(蓝、绿、红、黄),闪卡、双色和 promo 的主体也从近乎全黑的面板变为家族色的染色玻璃。稀有度仍占据视觉背景;wild、nitro 和永恒保留各自的世界。',
      ],
      it: [
        'I colori delle varianti finalmente si vedono — con decisione, fin dalla prima carta base: il colore posseduto lava il corpo della carta con un bordo colorato netto (blu, verde, rosso, giallo), e i corpi foil, dual e promo diventano un vetro colorato della loro famiglia invece di pannelli quasi neri. La rarità mantiene lo sfondo del visual; wild, nitro ed Eterno mantengono i loro mondi.',
      ],
      nl: [
        'Variantkleuren zijn eindelijk goed zichtbaar — vol en duidelijk, vanaf de allereerste basiskaart: de bezeten kleur wast over de kaartromp met een scherpe gekleurde rand (blauw, groen, rood, geel), en foil-, dual- en promorompen worden getint glas in hun familiekleur in plaats van bijna zwarte panelen. Zeldzaamheid behoudt de visualachtergrond; wild, nitro en Eeuwig behouden hun eigen werelden.',
      ],
      de: [
        'Die Variantenfarben sind endlich richtig sichtbar — kräftig, schon ab der ersten Basiskarte: die besessene Farbe überzieht den Kartenkörper mit einer klaren farbigen Kante (Blau, Grün, Rot, Gelb), und Foil-, Dual- und Promo-Körper werden zu getöntem Glas in ihrer Familienfarbe statt fast schwarzer Paneele. Die Seltenheit behält den Hintergrund des Visuals; Wild, Nitro und Ewig behalten ihre eigenen Welten.',
      ],
    },
  },
  {
    version: '1.33.1',
    date: '2026-08-08',
    changes: {
      en: [
        'Two fixes: the + quick-add button (and the card sheet\'s ✕) had drifted out of their corners since the touch-target enlargement — back in place, with their finger-sized tap zones verified. And circuit outlines are visible again in dark mode: the stroke stayed black from the era of light tile backgrounds.',
      ],
      fr: [
        'Deux correctifs : le bouton + d\'ajout rapide (et le ✕ de la fiche) avaient quitté leur coin depuis l\'agrandissement des zones tactiles — remis en place, zones de tap vérifiées. Et les tracés de circuits sont de nouveau visibles en thème sombre : le trait était resté noir, hérité de l\'époque des fonds de tuile clairs.',
      ],
      es: [
        'Dos correcciones: el botón + de añadido rápido (y la ✕ de la ficha) se habían salido de su esquina desde la ampliación de las zonas táctiles — recolocados, con sus zonas de toque verificadas. Y los trazados de los circuitos vuelven a verse en modo oscuro: el trazo seguía negro, heredado de la época de fondos claros.',
      ],
      zh: [
        '两项修复:快速添加的 + 按钮(以及卡片详情的 ✕)自触控区域扩大后偏离了原位——已归位,指尖大小的触区已验证。赛道轮廓在深色模式下重新可见:线条此前沿用了浅色卡格背景时代的黑色。',
      ],
      it: [
        'Due correzioni: il pulsante + di aggiunta rapida (e la ✕ della scheda) erano usciti dal loro angolo dall\'ampliamento delle aree tattili — rimessi al loro posto, con le zone di tocco verificate. E i tracciati dei circuiti sono di nuovo visibili in tema scuro: il tratto era rimasto nero, ereditato dall\'epoca degli sfondi chiari.',
      ],
      nl: [
        'Twee fixes: de +-knop voor snel toevoegen (en de ✕ van de kaartfiche) waren sinds de vergroting van de aanraakzones uit hun hoek verschoven — teruggezet, met geverifieerde tikzones. En de circuitomtrekken zijn weer zichtbaar in donker thema: de lijn was zwart gebleven uit de tijd van lichte tegelachtergronden.',
      ],
      de: [
        'Zwei Korrekturen: der +-Knopf zum schnellen Hinzufügen (und das ✕ des Kartenblatts) waren seit der Vergrößerung der Touch-Zonen aus ihrer Ecke gewandert — wieder an Ort und Stelle, mit geprüften Tippzonen. Und die Streckenverläufe sind im dunklen Design wieder sichtbar: die Linie war schwarz geblieben, ein Erbe der hellen Kachelhintergründe.',
      ],
    },
  },
  {
    version: '1.33.0',
    date: '2026-08-08',
    changes: {
      en: [
        'Card tiles follow one clear colour rule: the background now encodes RARITY (a sober halo, identical across all ten teams), the team lives in a fully saturated helmet plus a slim two-colour livery stripe, and foils shine on the card body. No more three-different-backgrounds for the same driver.',
        'Quick add is instant: one tap used to rebuild all 101 tiles and re-evaluate all 50 badges up to five times — it now updates only the tile you touched, in a single pass. Around 300 ms → under 50 ms on a mid-range phone.',
        'Variant types now appear in one canonical order everywhere (base colours, foils, duals, wild, nitro, promos) — on tiles, in the card sheet, the + picker and the stats. And reduced-motion now stops every foil animation, including the wild/nitro glow that kept running.',
      ],
      fr: [
        'Les tuiles suivent une règle de couleur unique : le fond encode désormais la RARETÉ (halo sobre, identique pour les dix écuries), l\'écurie vit dans un casque pleinement saturé plus une fine bande de livrée bicolore, et les foils brillent sur le corps de la carte. Fini les trois fonds différents pour le même pilote.',
        'L\'ajout rapide est instantané : un tap reconstruisait les 101 tuiles et réévaluait les 50 badges jusqu\'à cinq fois — il ne met plus à jour que la tuile touchée, en une seule passe. Environ 300 ms → moins de 50 ms sur un téléphone moyen.',
        'Les types de variante s\'affichent partout dans un ordre canonique unique (couleurs de base, foils, duals, wild, nitro, promos) — tuiles, fiche carte, sélecteur + et stats. Et la réduction des animations arrête désormais TOUS les effets foil, y compris le halo wild/nitro qui continuait de tourner.',
      ],
      es: [
        'Las casillas siguen una única regla de color: el fondo codifica ahora la RAREZA (halo sobrio, idéntico para las diez escuderías), la escudería vive en un casco totalmente saturado más una fina banda de librea bicolor, y los foils brillan en el cuerpo de la carta. Se acabaron los tres fondos distintos para el mismo piloto.',
        'El añadido rápido es instantáneo: un toque reconstruía las 101 casillas y reevaluaba las 50 insignias hasta cinco veces — ahora solo actualiza la casilla tocada, en una única pasada. De unos 300 ms a menos de 50 ms en un móvil medio.',
        'Los tipos de variante aparecen en un orden canónico único en todas partes (colores base, foils, duales, wild, nitro, promos) — casillas, ficha, selector + y estadísticas. Y la reducción de animaciones detiene ahora TODOS los efectos foil, incluido el brillo wild/nitro que seguía girando.',
      ],
      zh: [
        '卡格遵循统一的颜色规则:背景现在编码稀有度(低调的光晕,十支车队完全一致),车队体现在完全饱和的头盔和一条细双色涂装条上,闪卡效果则在卡片主体上闪耀。同一位车手三种不同背景的时代结束了。',
        '快速添加即刻响应:过去一次点按会重建全部 101 个卡格、并把 50 个徽章重新评估多达五次——现在只更新你按下的那一格,一次完成。中端手机上约 300 毫秒降至 50 毫秒以内。',
        '版本类型在所有界面按统一的规范顺序显示(基础色、闪卡、双色、wild、nitro、promo)——卡格、卡片详情、+ 选择器和统计。且减少动态效果模式现在会停止所有闪卡动画,包括此前仍在转动的 wild/nitro 光晕。',
      ],
      it: [
        'Le tessere seguono un\'unica regola di colore: lo sfondo codifica ora la RARITÀ (alone sobrio, identico per le dieci scuderie), la scuderia vive in un casco pienamente saturo più una sottile banda di livrea bicolore, e i foil brillano sul corpo della carta. Basta tre sfondi diversi per lo stesso pilota.',
        'L\'aggiunta rapida è istantanea: un tocco ricostruiva le 101 tessere e rivalutava i 50 badge fino a cinque volte — ora aggiorna solo la tessera toccata, in un unico passaggio. Da circa 300 ms a meno di 50 ms su un telefono medio.',
        'I tipi di variante appaiono ovunque in un unico ordine canonico (colori base, foil, dual, wild, nitro, promo) — tessere, scheda, selettore + e statistiche. E la riduzione delle animazioni ferma ora TUTTI gli effetti foil, incluso il bagliore wild/nitro che continuava a girare.',
      ],
      nl: [
        'De tegels volgen één duidelijke kleurregel: de achtergrond codeert nu ZELDZAAMHEID (een sobere gloed, identiek voor alle tien teams), het team leeft in een volledig verzadigde helm plus een smalle tweekleurige livery-streep, en foils schitteren op de kaartromp. Geen drie verschillende achtergronden meer voor dezelfde coureur.',
        'Snel toevoegen is nu direct: één tik herbouwde alle 101 tegels en evalueerde de 50 badges tot vijf keer opnieuw — nu wordt alleen de aangeraakte tegel bijgewerkt, in één keer. Van zo\'n 300 ms naar minder dan 50 ms op een middenklasse-telefoon.',
        'Varianttypes verschijnen overal in één canonieke volgorde (basiskleuren, foils, duals, wild, nitro, promo\'s) — tegels, kaartfiche, +-kiezer en statistieken. En verminderde beweging stopt nu ALLE foil-animaties, inclusief de wild/nitro-gloed die bleef draaien.',
      ],
      de: [
        'Die Kacheln folgen einer einzigen Farbregel: der Hintergrund codiert jetzt die SELTENHEIT (ein dezenter Schein, identisch für alle zehn Teams), das Team lebt in einem voll gesättigten Helm plus einem schmalen zweifarbigen Lackierungsstreifen, und Foils glänzen auf dem Kartenkörper. Schluss mit drei verschiedenen Hintergründen für denselben Fahrer.',
        'Schnelles Hinzufügen ist jetzt sofort: ein Tipp baute alle 101 Kacheln neu und bewertete die 50 Abzeichen bis zu fünfmal neu — jetzt wird nur die berührte Kachel aktualisiert, in einem Durchgang. Von rund 300 ms auf unter 50 ms auf einem Mittelklasse-Handy.',
        'Variantentypen erscheinen überall in einer einzigen kanonischen Reihenfolge (Grundfarben, Foils, Duals, Wild, Nitro, Promos) — Kacheln, Kartenblatt, +-Auswahl und Statistiken. Und reduzierte Bewegung stoppt jetzt ALLE Foil-Animationen, einschließlich des Wild/Nitro-Scheins, der weiterlief.',
      ],
    },
  },
  {
    version: '1.32.0',
    date: '2026-08-08',
    changes: {
      en: [
        'Everything is easier to tap: the wishlist star, the favourite heart, the + buttons, the quantity steppers, toggles and small controls now respond to a finger-sized area (44 px) — without any visual growing a single pixel.',
        'Views now glide: switching between Collection, Badges, Stats, Account and Settings slides softly in the same direction the navigation pill travels (~150 ms). Instant switch if your system prefers reduced motion.',
        'Fixed: the guided tour crashed silently on launch since 1.25.0 — it now runs through all 23 steps again.',
      ],
      fr: [
        'Tout est plus facile à toucher : l\'étoile wishlist, le cœur favori, les boutons +, les compteurs de quantité, les interrupteurs et les petits contrôles répondent désormais à une zone à la taille du doigt (44 px) — sans qu\'aucun visuel ne grossisse d\'un pixel.',
        'Les vues glissent : passer de Collection à Badges, Stats, Compte ou Réglages coulisse doucement dans le sens du voyage de la pastille de navigation (~150 ms). Bascule instantanée si ton système préfère réduire les animations.',
        'Corrigé : la visite guidée plantait silencieusement au lancement depuis la 1.25.0 — elle déroule à nouveau ses 23 étapes.',
      ],
      es: [
        'Todo es más fácil de tocar: la estrella de la lista de deseos, el corazón de favoritos, los botones +, los contadores de cantidad, los interruptores y los controles pequeños responden ahora a una zona del tamaño de un dedo (44 px) — sin que ningún visual crezca un solo píxel.',
        'Las vistas se deslizan: pasar entre Colección, Insignias, Estadísticas, Cuenta y Ajustes se desliza suavemente en la misma dirección en que viaja la píldora de navegación (~150 ms). Cambio instantáneo si tu sistema prefiere reducir las animaciones.',
        'Corregido: la visita guiada fallaba en silencio al iniciarse desde la 1.25.0 — vuelve a recorrer sus 23 pasos.',
      ],
      zh: [
        '一切都更好点按了:愿望清单的星星、收藏的爱心、+ 按钮、数量加减器、开关和各种小控件,现在都响应指尖大小的触区(44 像素)——而所有视觉元素一个像素都没有变大。',
        '视图切换有了过渡:在收藏、徽章、统计、账户和设置之间切换时,页面会顺着导航圆点的移动方向轻轻滑入(约 150 毫秒)。若系统偏好减少动态效果,则瞬间切换。',
        '修复:引导教程自 1.25.0 起启动即静默崩溃——现在 23 个步骤重新可以完整走完。',
      ],
      it: [
        'Tutto è più facile da toccare: la stella della wishlist, il cuore dei preferiti, i pulsanti +, i contatori di quantità, gli interruttori e i piccoli controlli rispondono ora a un\'area grande quanto un dito (44 px) — senza che alcun elemento visivo cresca di un solo pixel.',
        'Le viste scorrono: passare tra Collezione, Badge, Statistiche, Account e Impostazioni scivola dolcemente nella stessa direzione in cui viaggia la pillola di navigazione (~150 ms). Cambio istantaneo se il sistema preferisce ridurre le animazioni.',
        'Corretto: il tour guidato si bloccava in silenzio all\'avvio dalla 1.25.0 — ora percorre di nuovo tutti i 23 passaggi.',
      ],
      nl: [
        'Alles is makkelijker aan te tikken: de wishlist-ster, het favorietenhart, de +-knoppen, de aantaltellers, de schakelaars en kleine bedieningselementen reageren nu op een vingergrote zone (44 px) — zonder dat er ook maar één pixel visueel groeit.',
        'Weergaven glijden nu: wisselen tussen Collectie, Badges, Statistieken, Account en Instellingen schuift zacht mee in de richting waarin de navigatiepil beweegt (~150 ms). Directe wissel als je systeem minder beweging verkiest.',
        'Opgelost: de rondleiding crashte sinds 1.25.0 stilletjes bij het starten — ze doorloopt weer alle 23 stappen.',
      ],
      de: [
        'Alles lässt sich leichter antippen: der Wunschlisten-Stern, das Favoriten-Herz, die +-Knöpfe, die Mengenzähler, die Schalter und kleine Bedienelemente reagieren jetzt auf eine fingergroße Zone (44 px) — ohne dass irgendein Element auch nur einen Pixel wächst.',
        'Ansichten gleiten jetzt: der Wechsel zwischen Sammlung, Abzeichen, Statistiken, Konto und Einstellungen gleitet sanft in die Richtung, in die die Navigationspille wandert (~150 ms). Sofortiger Wechsel, wenn dein System reduzierte Bewegung bevorzugt.',
        'Behoben: die geführte Tour stürzte seit 1.25.0 beim Start stumm ab — sie durchläuft wieder alle 23 Schritte.',
      ],
    },
  },
  {
    version: '1.31.0',
    date: '2026-08-08',
    changes: {
      en: [
        'Cards get a real visual world: every driver now wears a generic helmet in their team\'s colours over an abstract team livery — ten invented geometric signatures, one per team (a blade, a chevron, a wave…), evocative through colour alone, copying nothing. Team cards pair a reworked monogram with the full team name.',
        'The interface speaks one visual language: emojis are replaced by a crafted set of monochrome icons — variant symbols, colour dots, a golden seal for complete sets, a filled warning triangle, and ISO codes instead of flags in the language picker. Emojis stay where they are content: badges, titles and card flags.',
      ],
      fr: [
        'Les cartes gagnent un vrai monde visuel : chaque pilote porte désormais un casque générique aux couleurs de son écurie sur une livrée abstraite — dix signatures géométriques inventées, une par équipe (une lame, un chevron, une vague…), évocatrices par la seule couleur, sans rien copier. Les cartes d\'écurie associent un monogramme retravaillé au nom complet de l\'équipe.',
        'L\'interface parle une seule langue visuelle : les émojis laissent place à un jeu d\'icônes monochromes dessinées — symboles de variantes, pastilles de couleurs, sceau doré des sets complets, triangle d\'avertissement plein, et codes ISO à la place des drapeaux dans le choix de langue. Les émojis restent là où ils sont du contenu : badges, titres et drapeaux des cartes.',
      ],
      es: [
        'Las cartas ganan un mundo visual propio: cada piloto lleva ahora un casco genérico con los colores de su escudería sobre una librea abstracta — diez firmas geométricas inventadas, una por equipo (una hoja, un chevrón, una ola…), evocadoras solo por el color, sin copiar nada. Las cartas de escudería combinan un monograma retrabajado con el nombre completo del equipo.',
        'La interfaz habla un único lenguaje visual: los emojis dan paso a un juego de iconos monocromos dibujados — símbolos de variantes, puntos de color, un sello dorado para los sets completos, un triángulo de aviso relleno y códigos ISO en lugar de banderas en el selector de idioma. Los emojis se quedan donde son contenido: insignias, títulos y banderas de las cartas.',
      ],
      zh: [
        '卡片拥有了真正的视觉世界:每位车手都戴上了以车队配色绘制的通用头盔,背景是抽象的车队涂装——十种原创几何签名,每队一种(利刃、山形纹、波浪……),仅靠颜色唤起联想,不复制任何真实涂装。车队卡则将重新设计的字母缩写与车队全名搭配呈现。',
        '界面统一为一种视觉语言:表情符号被一套精心绘制的单色图标取代——版本符号、色点、成套收藏的金色印章、实心警告三角,语言选择也改用 ISO 代码代替旗帜。属于内容的表情符号保留:徽章、称号和卡片上的国旗。',
      ],
      it: [
        'Le carte guadagnano un vero mondo visivo: ogni pilota indossa ora un casco generico nei colori della sua scuderia su una livrea astratta — dieci firme geometriche inventate, una per squadra (una lama, un chevron, un\'onda…), evocative con il solo colore, senza copiare nulla. Le carte scuderia abbinano un monogramma ridisegnato al nome completo del team.',
        'L\'interfaccia parla un solo linguaggio visivo: le emoji lasciano il posto a un set di icone monocrome disegnate — simboli delle varianti, punti colore, un sigillo dorato per i set completi, un triangolo di avviso pieno e codici ISO al posto delle bandiere nella scelta della lingua. Le emoji restano dove sono contenuto: badge, titoli e bandiere delle carte.',
      ],
      nl: [
        'De kaarten krijgen een echte visuele wereld: elke coureur draagt nu een generieke helm in de kleuren van zijn team op een abstracte livery — tien bedachte geometrische signaturen, één per team (een kling, een chevron, een golf…), herkenbaar door alleen de kleur, zonder iets te kopiëren. Teamkaarten combineren een herwerkt monogram met de volledige teamnaam.',
        'De interface spreekt één visuele taal: emoji\'s maken plaats voor een getekende set monochrome iconen — variantsymbolen, kleurstippen, een gouden zegel voor complete sets, een gevulde waarschuwingsdriehoek, en ISO-codes in plaats van vlaggen in de taalkeuze. Emoji\'s blijven waar ze inhoud zijn: badges, titels en kaartvlaggen.',
      ],
      de: [
        'Die Karten bekommen eine echte Bildwelt: jeder Fahrer trägt jetzt einen generischen Helm in den Farben seines Teams auf einer abstrakten Lackierung — zehn erfundene geometrische Signaturen, eine pro Team (eine Klinge, ein Chevron, eine Welle…), allein durch Farbe erkennbar, ohne etwas zu kopieren. Teamkarten kombinieren ein überarbeitetes Monogramm mit dem vollen Teamnamen.',
        'Die Oberfläche spricht eine visuelle Sprache: Emojis weichen einem gezeichneten Satz monochromer Icons — Variantensymbole, Farbpunkte, ein goldenes Siegel für komplette Sets, ein gefülltes Warndreieck und ISO-Codes statt Flaggen in der Sprachauswahl. Emojis bleiben, wo sie Inhalt sind: Abzeichen, Titel und Kartenflaggen.',
      ],
    },
  },
  {
    version: '1.30.0',
    date: '2026-08-07',
    changes: {
      en: [
        'The app no longer loads a single file from the internet. The F1 and UNO logos, the team logos and the driver photos were all hotlinked from other people\'s servers — trademarks in an app that calls itself a fan project, and an "offline mode" that quietly depended on the network. All 33 are gone.',
        'A new identity replaces them: an "F1 UNO Élite" typographic lockup with an abstract speed bar, on the header, the PIN screen, the language picker and the app icon. Driver cards now lead with their race number in full team colour, and team cards with a monogram — no borrowed marks anywhere.',
      ],
      fr: [
        'L\'app ne charge plus un seul fichier depuis internet. Les logos F1 et UNO, les logos d\'écuries et les photos de pilotes étaient tous hotlinkés depuis les serveurs d\'autrui — des marques déposées dans une app qui se déclare fan project, et un « mode hors-ligne » qui dépendait discrètement du réseau. Les 33 ont disparu.',
        'Une identité propre les remplace : un lockup typographique « F1 UNO Élite » avec une barre de vitesse abstraite, sur le header, l\'écran PIN, le choix de langue et l\'icône de l\'app. Les cartes pilote mettent désormais en avant leur numéro de course dans la couleur de l\'écurie, et les cartes d\'écurie un monogramme — plus aucune marque empruntée.',
      ],
      es: [
        'La app ya no carga ni un solo archivo desde internet. Los logotipos de F1 y UNO, los de las escuderías y las fotos de pilotos estaban enlazados desde servidores ajenos — marcas registradas en una app que se declara proyecto de fans, y un «modo sin conexión» que dependía en silencio de la red. Los 33 han desaparecido.',
        'Los sustituye una identidad propia: un lockup tipográfico «F1 UNO Élite» con una barra de velocidad abstracta, en la cabecera, la pantalla del PIN, la elección de idioma y el icono. Las cartas de piloto destacan ahora su número de carrera en el color de la escudería, y las de escudería un monograma — ninguna marca prestada.',
      ],
      zh: [
        '应用不再从互联网加载任何一个文件。F1 与 UNO 的标志、车队标志和车手照片此前全部外链自他人服务器——一个自称粉丝作品的应用里塞满注册商标，而所谓的「离线模式」其实悄悄依赖网络。这 33 个外链已全部移除。',
        '取而代之的是自有识别：「F1 UNO Élite」文字标识配一道抽象速度条，用于顶栏、PIN 界面、语言选择和应用图标。车手卡现在以车队配色的赛车号为主视觉，车队卡则用字母缩写——不再借用任何品牌元素。',
      ],
      it: [
        'L\'app non carica più un solo file da internet. I loghi F1 e UNO, quelli delle scuderie e le foto dei piloti erano tutti collegati ai server altrui — marchi registrati in un\'app che si dichiara fan project, e una «modalità offline» che dipendeva silenziosamente dalla rete. Tutti e 33 sono spariti.',
        'Al loro posto un\'identità propria: un lockup tipografico «F1 UNO Élite» con una barra di velocità astratta, sull\'intestazione, la schermata PIN, la scelta della lingua e l\'icona. Le carte pilota ora mettono in primo piano il numero di gara nel colore della scuderia, e quelle di scuderia un monogramma — nessun marchio preso in prestito.',
      ],
      nl: [
        'De app laadt geen enkel bestand meer van internet. De F1- en UNO-logo\'s, de teamlogo\'s en de coureursfoto\'s werden allemaal van andermans servers gehaald — handelsmerken in een app die zichzelf fanproject noemt, en een «offline modus» die stilletjes van het netwerk afhing. Alle 33 zijn weg.',
        'Een eigen identiteit vervangt ze: een typografisch «F1 UNO Élite»-lockup met een abstracte snelheidsbalk, op de header, het pinscherm, de taalkeuze en het app-icoon. Coureurskaarten tonen nu hun racenummer in de teamkleur, teamkaarten een monogram — geen geleende merken meer.',
      ],
      de: [
        'Die App lädt keine einzige Datei mehr aus dem Internet. Die F1- und UNO-Logos, die Teamlogos und die Fahrerfotos waren alle von fremden Servern verlinkt — eingetragene Marken in einer App, die sich Fanprojekt nennt, und ein „Offline-Modus", der klammheimlich vom Netz abhing. Alle 33 sind weg.',
        'Eine eigene Identität ersetzt sie: ein typografisches „F1 UNO Élite"-Lockup mit abstraktem Geschwindigkeitsbalken, in der Kopfzeile, im PIN-Bildschirm, in der Sprachauswahl und im App-Icon. Fahrerkarten zeigen jetzt ihre Startnummer in der Teamfarbe, Teamkarten ein Monogramm — keine geliehenen Marken mehr.',
      ],
    },
  },
  {
    version: '1.29.1',
    date: '2026-08-07',
    changes: {
      en: ['Documentation only: the whole screenshot set was regenerated from a deterministic seed and the READMEs were refreshed in all 7 languages. Nothing in the app itself changed.'],
      fr: ['Documentation seulement : tout le jeu de captures a été régénéré depuis un seed déterministe et les README ont été mis à jour dans les 7 langues. Rien n’a changé dans l’app elle-même.'],
      es: ['Solo documentación: todo el conjunto de capturas se regeneró desde una semilla determinista y los README se actualizaron en los 7 idiomas. Nada cambió en la app.'],
      zh: ['仅文档更新：整套截图已按确定性种子重新生成，7 种语言的 README 也已同步更新。应用本身没有任何改动。'],
      it: ['Solo documentazione: l’intero set di schermate è stato rigenerato da un seed deterministico e i README sono stati aggiornati in tutte e 7 le lingue. Nulla è cambiato nell’app.'],
      nl: ['Alleen documentatie: de volledige set schermafbeeldingen is opnieuw gegenereerd vanuit een deterministische seed en de README’s zijn in alle 7 talen bijgewerkt. In de app zelf is niets veranderd.'],
      de: ['Nur Dokumentation: der komplette Satz Screenshots wurde aus einem deterministischen Seed neu erzeugt und die READMEs in allen 7 Sprachen aktualisiert. In der App selbst hat sich nichts geändert.'],
    },
  },
  {
    version: '1.29.0',
    date: '2026-08-07',
    changes: {
      en: [
        'The Badges page has been rebuilt from scratch: a progress ring with your title, a "Next badge" card that always shows the closest one to dropping, and 6 families (Journey, Complete sets, Foils, Colours, Passion, Experiences) with compact tiles — unlocked in colour, in-progress with an arc, locked desaturated. The Journey is a milestone track from 1 to 101.',
        'Badges now celebrate: when one drops during use, a dedicated toast appears (with a short vibration where supported) and the tile bursts on the page. Multiple unlocks are grouped into one toast. Tap a badge for its detail: description, progress, contributing cards, and its unlock date — recorded from now on.',
        'Pick your own goal: "Make it my goal" pins any badge to the top card instead of the automatic pick. The hero also names your hardest badge, and a share button exports your collector card as an image.',
      ],
      fr: [
        'La page Badges est reconstruite de zéro : un anneau de progression avec ton titre, une carte « Prochain badge » qui montre toujours le plus proche de tomber, et 6 familles (Parcours, Sets complets, Foils, Couleurs, Passion, Expériences) en tuiles compactes — débloqué en couleur, en cours avec un arc, verrouillé désaturé. Le Parcours est une échelle de jalons de 1 à 101.',
        'Les badges célèbrent désormais : quand l\'un tombe pendant l\'usage, un toast dédié apparaît (avec une courte vibration là où c\'est possible) et la tuile explose sur la page. Plusieurs déblocages d\'un coup sont regroupés en un seul toast. Un appui sur un badge ouvre son détail : description, progression, cartes contributives, et sa date de déblocage — enregistrée à partir de maintenant.',
        'Choisis ton propre objectif : « En faire mon objectif » épingle n\'importe quel badge dans la carte du haut à la place du calcul automatique. Le hero nomme aussi ton badge le plus difficile, et un bouton de partage exporte ta carte de collectionneur en image.',
      ],
      es: [
        'La página de insignias se ha reconstruido desde cero: un anillo de progreso con tu título, una tarjeta «Próxima insignia» que siempre muestra la más cercana a caer, y 6 familias (Trayectoria, Sets completos, Foils, Colores, Pasión, Experiencias) en fichas compactas — desbloqueada en color, en curso con un arco, bloqueada desaturada. La Trayectoria es una escalera de hitos de 1 a 101.',
        'Las insignias ahora celebran: cuando una cae durante el uso, aparece un aviso dedicado (con una breve vibración donde sea posible) y la ficha estalla en la página. Varios desbloqueos a la vez se agrupan en un solo aviso. Un toque abre su detalle: descripción, progreso, cartas contributivas y su fecha de desbloqueo — registrada a partir de ahora.',
        'Elige tu propio objetivo: «Convertirla en mi objetivo» fija cualquier insignia en la tarjeta superior en lugar del cálculo automático. El héroe también nombra tu insignia más difícil, y un botón de compartir exporta tu tarjeta de coleccionista como imagen.',
      ],
      zh: [
        '徽章页面彻底重建：进度圆环搭配你的头衔，「下一枚徽章」卡片始终展示最接近解锁的一枚，50 枚徽章分为 6 个家族（收集之路、完整套组、闪卡、颜色、热爱、亲身经历），以紧凑磁贴呈现——已解锁的彩色、进行中的带进度弧、未解锁的去色。收集之路是从 1 到 101 的里程碑阶梯。',
        '徽章现在会庆祝：使用中解锁时会弹出专属提示（支持的设备上伴随短震动），页面上的磁贴同时绽放。一次解锁多枚会合并为一条提示。点击徽章查看详情：说明、进度、贡献卡牌，以及解锁日期——从现在起开始记录。',
        '选择你自己的目标：「设为我的目标」可将任意徽章钉在顶部卡片，替代自动推荐。头部还会标出你最难得到的徽章，分享按钮可将你的收藏家卡片导出为图片。',
      ],
      it: [
        'La pagina Badge è ricostruita da zero: un anello di progresso con il tuo titolo, una scheda «Prossimo badge» che mostra sempre il più vicino a cadere, e 6 famiglie (Percorso, Set completi, Foil, Colori, Passione, Esperienze) in tessere compatte — sbloccato a colori, in corso con un arco, bloccato desaturato. Il Percorso è una scala di traguardi da 1 a 101.',
        'I badge ora festeggiano: quando uno cade durante l\'uso appare un avviso dedicato (con una breve vibrazione dove possibile) e la tessera esplode sulla pagina. Più sblocchi insieme vengono raggruppati in un solo avviso. Un tocco apre il dettaglio: descrizione, progresso, carte contributive e la data di sblocco — registrata da ora in poi.',
        'Scegli il tuo obiettivo: «Rendilo il mio obiettivo» fissa qualsiasi badge nella scheda in alto al posto del calcolo automatico. L\'intestazione nomina anche il tuo badge più difficile, e un pulsante di condivisione esporta la tua carta da collezionista come immagine.',
      ],
      nl: [
        'De badgepagina is helemaal opnieuw opgebouwd: een voortgangsring met je titel, een «Volgende badge»-kaart die altijd de dichtstbijzijnde toont, en 6 families (Parcours, Complete sets, Foils, Kleuren, Passie, Ervaringen) in compacte tegels — ontgrendeld in kleur, bezig met een boog, vergrendeld ontkleurd. Het Parcours is een mijlpalenladder van 1 tot 101.',
        'Badges vieren nu feest: valt er één tijdens het gebruik, dan verschijnt een eigen melding (met een korte trilling waar mogelijk) en barst de tegel open op de pagina. Meerdere ontgrendelingen tegelijk worden gebundeld in één melding. Tik op een badge voor detail: omschrijving, voortgang, bijdragende kaarten en de ontgrendeldatum — vanaf nu vastgelegd.',
        'Kies je eigen doel: «Maak dit mijn doel» pint elke badge vast in de bovenste kaart in plaats van de automatische keuze. De held toont ook je moeilijkste badge, en een deelknop exporteert je verzamelaarskaart als afbeelding.',
      ],
      de: [
        'Die Abzeichen-Seite wurde von Grund auf neu gebaut: ein Fortschrittsring mit deinem Titel, eine „Nächstes Abzeichen"-Karte, die immer das am nächsten stehende zeigt, und 6 Familien (Werdegang, Komplette Sets, Foils, Farben, Leidenschaft, Erlebnisse) in kompakten Kacheln — freigeschaltet in Farbe, laufend mit Bogen, gesperrt entsättigt. Der Werdegang ist eine Meilenstein-Leiter von 1 bis 101.',
        'Abzeichen feiern jetzt: Fällt eines während der Nutzung, erscheint ein eigener Hinweis (mit kurzer Vibration, wo möglich) und die Kachel platzt auf der Seite auf. Mehrere Freischaltungen auf einmal werden in einem Hinweis gebündelt. Ein Tipp öffnet das Detail: Beschreibung, Fortschritt, beitragende Karten und das Freischaltdatum — ab jetzt aufgezeichnet.',
        'Wähle dein eigenes Ziel: „Zu meinem Ziel machen" pinnt jedes Abzeichen in die obere Karte statt der automatischen Wahl. Der Held nennt auch dein schwerstes Abzeichen, und ein Teilen-Knopf exportiert deine Sammlerkarte als Bild.',
      ],
    },
  },
  {
    version: '1.28.0',
    date: '2026-08-07',
    changes: {
      en: [
        'The PIN screen now speaks the same language as the code entry: segmented boxes under a lock icon, each digit briefly visible before masking, a shake with an orange outline when wrong, a brief green when right — quiet, no celebration.',
        'Managing the PIN became a guided flow with visible progress: create (1/2 then 2/2), change (old code 1/3, new 2/3, confirm 3/3), and disabling now requires typing the current code — an "OK" button no longer removes a protection.',
        'The security section shows its state at a glance: an Active/Off chip next to the PIN, a short description, and one clear action per row.',
      ],
      fr: [
        'L\'écran PIN parle désormais la même langue que la saisie de code : cases segmentées sous un cadenas, chaque chiffre visible un instant avant masquage, secousse à contour orange si faux, vert bref si juste — sobre, sans célébration.',
        'La gestion du code devient un parcours guidé à progression visible : créer (1/2 puis 2/2), changer (ancien code 1/3, nouveau 2/3, confirmation 3/3), et désactiver exige désormais de saisir le code actuel — un bouton « OK » ne retire plus une protection.',
        'La section sécurité montre son état d\'un coup d\'œil : une puce Actif/Inactif à côté du PIN, une description courte, et une action claire par ligne.',
      ],
      es: [
        'La pantalla del PIN habla ahora el mismo idioma que la entrada de código: casillas segmentadas bajo un candado, cada dígito visible un instante antes de ocultarse, sacudida con contorno naranja si es erróneo, verde breve si es correcto — sobrio, sin celebración.',
        'La gestión del PIN es ahora un recorrido guiado con progreso visible: crear (1/2 y 2/2), cambiar (código antiguo 1/3, nuevo 2/3, confirmación 3/3), y desactivar exige teclear el código actual — un botón «OK» ya no retira una protección.',
        'La sección de seguridad muestra su estado de un vistazo: un distintivo Activo/Inactivo junto al PIN, una descripción corta y una acción clara por fila.',
      ],
      zh: [
        'PIN 界面与验证码输入终于说同一种语言：锁形图标下的分格输入框，每个数字短暂显示后即掩码，输错时橙色轮廓抖动，输对时短暂变绿——克制，不张扬。',
        'PIN 管理变成带可见进度的引导流程：创建（1/2、2/2）、修改（旧密码 1/3、新密码 2/3、确认 3/3），停用现在必须输入当前密码——仅按「确定」不再能移除保护。',
        '安全区域一眼可见状态：PIN 旁的已启用/未启用标签、简短说明、每行一个明确操作。',
      ],
      it: [
        'La schermata PIN parla ora la stessa lingua dell\'inserimento codice: caselle segmentate sotto un lucchetto, ogni cifra visibile un istante prima di essere mascherata, scossa con contorno arancione se errato, verde breve se giusto — sobrio, senza celebrazioni.',
        'La gestione del PIN diventa un percorso guidato con progresso visibile: creare (1/2 poi 2/2), cambiare (vecchio codice 1/3, nuovo 2/3, conferma 3/3), e disattivare richiede ora di digitare il codice attuale — un «OK» non rimuove più una protezione.',
        'La sezione sicurezza mostra il suo stato a colpo d\'occhio: un badge Attivo/Disattivo accanto al PIN, una breve descrizione e un\'azione chiara per riga.',
      ],
      nl: [
        'Het pinscherm spreekt nu dezelfde taal als de code-invoer: vakjes onder een hangslot, elk cijfer even zichtbaar voor het wordt gemaskeerd, een schud met oranje rand bij fout, kort groen bij goed — ingetogen, zonder feestje.',
        'Pinbeheer is een begeleide flow met zichtbare voortgang: aanmaken (1/2 en 2/2), wijzigen (oude code 1/3, nieuwe 2/3, bevestiging 3/3), en uitschakelen vereist nu het intypen van de huidige code — een «OK»-knop haalt geen bescherming meer weg.',
        'De beveiligingssectie toont haar status in één oogopslag: een Actief/Uit-label naast de pincode, een korte omschrijving en één duidelijke actie per rij.',
      ],
      de: [
        'Der PIN-Bildschirm spricht jetzt dieselbe Sprache wie die Code-Eingabe: Segmentfelder unter einem Schloss, jede Ziffer kurz sichtbar vor der Maskierung, Schütteln mit orangefarbenem Rand bei falsch, kurzes Grün bei richtig — dezent, ohne Feier.',
        'Die PIN-Verwaltung ist ein geführter Ablauf mit sichtbarem Fortschritt: Anlegen (1/2, dann 2/2), Ändern (alter Code 1/3, neuer 2/3, Bestätigung 3/3), und Deaktivieren verlangt jetzt die Eingabe des aktuellen Codes — ein „OK" entfernt keinen Schutz mehr.',
        'Der Sicherheitsbereich zeigt seinen Zustand auf einen Blick: ein Aktiv/Aus-Chip neben der PIN, eine kurze Beschreibung und eine klare Aktion pro Zeile.',
      ],
    },
  },
  {
    version: '1.27.0',
    date: '2026-08-07',
    changes: {
      en: [
        'The code entry got a real face-lift: the active box now glows in the app\'s red with a visible blinking caret, each digit lands with a tiny pop, and a complete code verifies itself — no button press needed.',
        'Clear answers in both directions: a wrong code shakes the boxes with an orange outline (deliberately not the accent red), a correct one turns them green, draws a check and sparkles briefly before signing you in.',
      ],
      fr: [
        'La saisie du code a droit à un vrai lifting : la case active s\'allume dans le rouge de l\'app avec un curseur clignotant bien visible, chaque chiffre atterrit avec un petit rebond, et un code complet se vérifie tout seul — plus besoin d\'appuyer sur le bouton.',
        'Une réponse claire dans les deux sens : un code faux secoue les cases avec un contour orange (volontairement distinct du rouge de l\'app), un code juste les passe au vert, dessine une coche et scintille brièvement avant la connexion.',
      ],
      es: [
        'La entrada del código se renueva: la casilla activa se ilumina en el rojo de la app con un cursor parpadeante bien visible, cada dígito aterriza con un pequeño rebote y un código completo se verifica solo — ya no hace falta pulsar el botón.',
        'Respuesta clara en ambos sentidos: un código erróneo sacude las casillas con un contorno naranja (a propósito distinto del rojo de la app), uno correcto las pone en verde, dibuja una marca y destella brevemente antes de iniciar sesión.',
      ],
      zh: [
        '验证码输入全面翻新：当前输入框以应用红色高亮并带清晰闪烁光标，每个数字落下时有轻微弹跳，输满即自动验证——无需再按按钮。',
        '正误一目了然：错误的验证码会让输入框抖动并显示橙色轮廓（有意区别于应用的红色），正确的则变绿、画出对勾并短暂闪光，随后完成登录。',
      ],
      it: [
        'L\'inserimento del codice si rifà il look: la casella attiva si accende nel rosso dell\'app con un cursore lampeggiante ben visibile, ogni cifra atterra con un piccolo rimbalzo e un codice completo si verifica da solo — niente più pulsante da premere.',
        'Risposta chiara in entrambi i sensi: un codice errato scuote le caselle con un contorno arancione (volutamente diverso dal rosso dell\'app), uno giusto le fa diventare verdi, disegna una spunta e brilla un istante prima dell\'accesso.',
      ],
      nl: [
        'De code-invoer kreeg een echte opfrisbeurt: het actieve vakje licht op in het rood van de app met een duidelijk knipperende cursor, elk cijfer landt met een kleine stuiter, en een volledige code verifieert zichzelf — geen knop meer nodig.',
        'Duidelijk antwoord in beide richtingen: een foute code schudt de vakjes met een oranje rand (bewust anders dan het rood van de app), een juiste maakt ze groen, tekent een vinkje en glinstert kort voor het inloggen.',
      ],
      de: [
        'Die Code-Eingabe bekam ein echtes Face-Lift: das aktive Feld leuchtet im Rot der App mit gut sichtbarem blinkendem Cursor, jede Ziffer landet mit einem kleinen Hüpfer, und ein vollständiger Code prüft sich von selbst — kein Knopfdruck mehr nötig.',
        'Klare Antwort in beide Richtungen: ein falscher Code schüttelt die Felder mit orangefarbenem Rand (bewusst nicht das Akzent-Rot), ein richtiger färbt sie grün, zeichnet einen Haken und funkelt kurz vor der Anmeldung.',
      ],
    },
  },
  {
    version: '1.26.0',
    date: '2026-08-07',
    changes: {
      en: ['All 23 Grand Prix track outlines are now drawn from real GPS surveys instead of freehand sketches. Spa gets back Eau Rouge and Pouhon, Suzuka its famous figure-eight crossover, Zandvoort, Shanghai and Silverstone their true shapes — every circuit is finally recognisable at a glance.'],
      fr: ['Les 23 tracés de Grand Prix sont désormais issus de relevés GPS réels et non plus de croquis à main levée. Spa retrouve l’Eau Rouge et Pouhon, Suzuka son fameux croisement en huit, Zandvoort, Shanghai et Silverstone leur vraie silhouette — chaque circuit est enfin reconnaissable au premier regard.'],
      es: ['Los 23 trazados de Gran Premio proceden ahora de levantamientos GPS reales en lugar de bocetos a mano alzada. Spa recupera Eau Rouge y Pouhon, Suzuka su famoso cruce en ocho, Zandvoort, Shanghái y Silverstone su verdadera silueta — cada circuito por fin se reconoce a primera vista.'],
      zh: ['23 条大奖赛赛道轮廓现在均基于真实 GPS 测绘数据绘制，不再是手绘草图。斯帕找回了 Eau Rouge 和 Pouhon，铃鹿恢复了著名的 8 字交叉，赞德福特、上海和银石也回到了真实形状——每条赛道终于一眼就能认出。'],
      it: ['I 23 tracciati dei Gran Premi derivano ora da rilievi GPS reali e non più da schizzi a mano libera. Spa ritrova Eau Rouge e Pouhon, Suzuka il suo celebre incrocio a otto, Zandvoort, Shanghai e Silverstone la loro vera sagoma — ogni circuito è finalmente riconoscibile a colpo d’occhio.'],
      nl: ['De 23 Grand Prix-tracés zijn nu gebaseerd op echte gps-metingen in plaats van schetsen uit de losse hand. Spa krijgt Eau Rouge en Pouhon terug, Suzuka zijn beroemde achtvormige kruising, Zandvoort, Shanghai en Silverstone hun ware vorm — elk circuit is eindelijk in één oogopslag herkenbaar.'],
      de: ['Alle 23 Grand-Prix-Streckenverläufe stammen jetzt aus echten GPS-Vermessungen statt aus Freihandskizzen. Spa erhält Eau Rouge und Pouhon zurück, Suzuka seine berühmte Achterkreuzung, Zandvoort, Shanghai und Silverstone ihre wahre Silhouette — jede Strecke ist endlich auf einen Blick erkennbar.'],
    },
  },
  {
    version: '1.25.1',
    date: '2026-08-07',
    changes: {
      en: ['When a sign-in email fails to leave, the app now names the actual reason: quota reached, mail service down, sign-ups closed, or an address the mail service refuses to deliver to. It used to say “check the address” in all four cases — misleading advice in three of them.'],
      fr: ['Quand l’e-mail de connexion ne part pas, l’app dit désormais pourquoi : quota atteint, service d’envoi en panne, inscriptions fermées, ou adresse que le service refuse de livrer. Elle répondait « vérifie l’adresse » dans les quatre cas — un mauvais conseil dans trois d’entre eux.'],
      es: ['Cuando el correo de acceso no sale, la app ahora dice por qué: cuota alcanzada, servicio de correo caído, registros cerrados o una dirección a la que el servicio se niega a entregar. Antes respondía «comprueba la dirección» en los cuatro casos — un mal consejo en tres de ellos.'],
      zh: ['登录邮件发不出去时，应用现在会说明真正的原因：配额用尽、邮件服务故障、注册已关闭，或该地址被邮件服务拒绝投递。此前四种情况都只说「请检查邮箱地址」——其中三种都是误导。'],
      it: ['Quando l’e-mail di accesso non parte, l’app ora dice perché: quota raggiunta, servizio di posta non raggiungibile, iscrizioni chiuse o indirizzo a cui il servizio rifiuta di consegnare. Prima rispondeva «controlla l’indirizzo» in tutti e quattro i casi — un consiglio sbagliato in tre.'],
      nl: ['Als de inlogmail niet vertrekt, noemt de app nu de echte reden: quotum bereikt, maildienst uit de lucht, aanmeldingen gesloten, of een adres waaraan de dienst weigert te bezorgen. Voorheen stond er in alle vier de gevallen “controleer het adres” — misleidend advies in drie ervan.'],
      de: ['Wenn die Anmelde-E-Mail nicht rausgeht, nennt die App jetzt den echten Grund: Kontingent erreicht, Maildienst gestört, Registrierungen geschlossen oder eine Adresse, an die der Dienst nicht zustellt. Bisher hieß es in allen vier Fällen „Adresse prüfen“ — in dreien ein falscher Rat.'],
    },
  },
  {
    version: '1.25.0',
    date: '2026-08-07',
    changes: {
      en: [
        'Read-only sharing is now genuinely read-only: the Account page is locked in spectator mode. Cloud sign-in, sync, backups, export, the QR code, feedback and data deletion are all out of reach — including the export and backup code, which used to let a visitor walk away with the whole collection.',
        'The lock holds even against direct calls: every sensitive action refuses on its own, not just its button. Shared backup links are ignored too.',
        'The locked page explains why and offers a way in: one tap asks for the PIN and hands the account back to its owner.',
      ],
      fr: [
        'Le partage en lecture seule l’est vraiment : la page Compte est verrouillée en mode spectateur. Connexion cloud, synchro, sauvegardes, export, QR, avis et suppression sont hors d’atteinte — y compris l’export et le code de sauvegarde, qui permettaient jusqu’ici à un visiteur de repartir avec toute la collection.',
        'Le verrou tient même face à un appel direct : chaque action sensible refuse d’elle-même, pas seulement son bouton. Les liens de sauvegarde partagés sont ignorés eux aussi.',
        'La page verrouillée explique pourquoi et donne la sortie : un appui demande le code PIN et rend le compte à son propriétaire.',
      ],
      es: [
        'El uso compartido de solo lectura ahora lo es de verdad: la página Cuenta está bloqueada en modo espectador. Inicio de sesión en la nube, sincronización, copias, exportación, QR, opiniones y borrado quedan fuera de alcance — incluidos la exportación y el código de copia, que hasta ahora permitían llevarse toda la colección.',
        'El bloqueo aguanta incluso ante una llamada directa: cada acción sensible se niega por sí misma, no solo su botón. Los enlaces de copia compartidos también se ignoran.',
        'La página bloqueada explica el motivo y ofrece la salida: un toque pide el PIN y devuelve la cuenta a su propietario.',
      ],
      zh: [
        '只读分享现在名副其实：旁观模式下「账户」页已锁定。云登录、同步、备份、导出、二维码、反馈和删除全部不可用——包括此前能让访客带走整份收藏的导出和备份码。',
        '这道锁连直接调用也挡得住：每个敏感操作自身就会拒绝，而不只是按钮。共享的备份链接同样会被忽略。',
        '锁定页会说明原因并给出出口：轻点一下即可输入 PIN 码，把账户交还给拥有者。',
      ],
      it: [
        'La condivisione in sola lettura ora lo è davvero: la pagina Account è bloccata in modalità spettatore. Accesso cloud, sincronizzazione, backup, esportazione, QR, feedback ed eliminazione sono fuori portata — inclusi l’esportazione e il codice di backup, che finora permettevano a un ospite di portarsi via l’intera collezione.',
        'Il blocco regge anche a una chiamata diretta: ogni azione sensibile rifiuta da sé, non solo il suo pulsante. Anche i link di backup condivisi vengono ignorati.',
        'La pagina bloccata spiega il perché e offre la via d’uscita: un tocco chiede il PIN e restituisce l’account al proprietario.',
      ],
      nl: [
        'Alleen-lezen delen is nu ook echt alleen-lezen: de Account-pagina is vergrendeld in de kijkmodus. Cloud-aanmelding, synchronisatie, back-ups, export, QR, feedback en verwijderen zijn onbereikbaar — inclusief de export en de back-upcode, waarmee een bezoeker tot nu toe de hele verzameling kon meenemen.',
        'Het slot houdt zelfs stand bij een directe aanroep: elke gevoelige actie weigert zelf, niet alleen de knop. Gedeelde back-uplinks worden eveneens genegeerd.',
        'De vergrendelde pagina legt uit waarom en biedt een uitweg: één tik vraagt de pincode en geeft het account terug aan de eigenaar.',
      ],
      de: [
        'Nur-Lesen-Teilen ist jetzt wirklich nur Lesen: die Konto-Seite ist im Zuschauermodus gesperrt. Cloud-Anmeldung, Synchronisierung, Backups, Export, QR, Feedback und Löschen sind unerreichbar — auch Export und Backup-Code, mit denen ein Besucher bisher die ganze Sammlung mitnehmen konnte.',
        'Die Sperre hält auch einem direkten Aufruf stand: jede sensible Aktion verweigert sich selbst, nicht nur ihr Button. Geteilte Backup-Links werden ebenfalls ignoriert.',
        'Die gesperrte Seite erklärt den Grund und bietet den Ausweg: ein Tippen fragt die PIN ab und gibt das Konto an seinen Besitzer zurück.',
      ],
    },
  },
  {
    version: '1.24.1',
    date: '2026-08-07',
    changes: {
      en: [
        'Security fix: spectator mode could be escaped by dragging the nav bead onto Settings — which even allowed turning the PIN off. Every route into Settings is now blocked in spectator mode.',
        'The Settings tab icon is back in spectator mode (it had gone blank) and is now a proper lock.',
        'Turning the PIN off, and switching local encryption on or off, now use an in-app confirmation. Browsers that suppress native dialogs made those buttons do nothing at all.',
      ],
      fr: [
        'Faille corrigée : le mode spectateur pouvait être contourné en faisant glisser la pastille de navigation sur Réglages — ce qui permettait même de désactiver le code PIN. Tous les chemins vers Réglages sont désormais bloqués en spectateur.',
        'L’icône de l’onglet Réglages réapparaît en mode spectateur (elle était vide) et prend la forme d’un cadenas.',
        'Désactiver le PIN, et activer ou désactiver le chiffrement local, passent maintenant par une confirmation intégrée. Les navigateurs qui bloquent les dialogues natifs rendaient ces boutons totalement inertes.',
      ],
      es: [
        'Fallo de seguridad corregido: el modo espectador podía burlarse arrastrando la burbuja de navegación hasta Ajustes — lo que incluso permitía desactivar el PIN. Ahora todas las rutas hacia Ajustes están bloqueadas en modo espectador.',
        'El icono de la pestaña Ajustes vuelve a verse en modo espectador (estaba vacío) y ahora es un candado.',
        'Desactivar el PIN y activar o desactivar el cifrado local usan ahora una confirmación integrada. Los navegadores que bloquean los diálogos nativos dejaban esos botones sin efecto alguno.',
      ],
      zh: [
        '安全修复：此前可以把导航圆珠拖到「设置」来绕过旁观模式——甚至能关闭 PIN 码。现在旁观模式下通往设置的所有路径都已封堵。',
        '旁观模式下「设置」标签的图标恢复显示（此前是空白），并改为一枚锁形图标。',
        '关闭 PIN 码、开启或关闭本地加密，现在改用应用内确认。此前在屏蔽原生对话框的浏览器中，这些按钮完全没有反应。',
      ],
      it: [
        'Falla corretta: la modalità spettatore poteva essere aggirata trascinando la pallina di navigazione su Impostazioni — il che permetteva persino di disattivare il PIN. Ora ogni percorso verso Impostazioni è bloccato in modalità spettatore.',
        'L’icona della scheda Impostazioni torna visibile in modalità spettatore (era vuota) ed è ora un lucchetto.',
        'Disattivare il PIN e attivare o disattivare la cifratura locale passano ora da una conferma integrata. Nei browser che bloccano le finestre native quei pulsanti non facevano assolutamente nulla.',
      ],
      nl: [
        'Beveiligingslek gedicht: de kijkmodus was te omzeilen door de navigatieknop naar Instellingen te slepen — waarmee zelfs de pincode uitgeschakeld kon worden. Elke route naar Instellingen is nu geblokkeerd in de kijkmodus.',
        'Het icoon van het tabblad Instellingen is terug in de kijkmodus (het was leeg) en is nu een slot.',
        'De pincode uitschakelen en lokale versleuteling aan- of uitzetten gebruiken nu een bevestiging in de app. Browsers die native dialoogvensters blokkeren maakten die knoppen volledig werkeloos.',
      ],
      de: [
        'Sicherheitslücke behoben: der Zuschauermodus ließ sich umgehen, indem man die Navigationsperle auf Einstellungen zog — damit konnte sogar die PIN abgeschaltet werden. Jeder Weg zu den Einstellungen ist im Zuschauermodus jetzt gesperrt.',
        'Das Symbol des Einstellungen-Tabs ist im Zuschauermodus wieder da (es war leer) und zeigt nun ein Schloss.',
        'Die PIN abschalten sowie die lokale Verschlüsselung ein- oder ausschalten laufen jetzt über eine In-App-Bestätigung. In Browsern, die native Dialoge unterdrücken, taten diese Schalter zuvor schlicht gar nichts.',
      ],
    },
  },
  {
    version: '1.24.0',
    date: '2026-08-07',
    changes: {
      en: [
        'Redesigned navigation: crisp outline icons replace the emoji, the bar hugs the active bead with an exact matching notch — and you can now grab the bead and slide it along the bar to switch views.',
        'A refined palette gives the app real depth: a deeper, warmer dark, four distinct surface levels, and softer hairline borders. Muted text is now readable everywhere.',
        'Settings and Badges match the Account page: colour-coded sections, and locked badges you can tell apart from unlocked ones at a glance.',
        'Cloud sign-in: the code goes into animated boxes — auto-advance, smart paste, green check on success.',
      ],
      fr: [
        'Navigation repensée : des icônes au trait remplacent les émojis, la barre épouse exactement la pastille active — et tu peux désormais attraper la pastille et la faire glisser le long de la barre pour changer de vue.',
        'Une palette affinée donne enfin de la profondeur à l’app : un sombre plus dense et légèrement chaud, quatre niveaux de surface distincts, des bordures plus fines. Le texte atténué est lisible partout.',
        'Réglages et Badges s’alignent sur la page Compte : sections identifiées par couleur, et badges verrouillés reconnaissables au premier coup d’œil.',
        'Connexion cloud : le code se saisit dans des cases animées — avance automatique, collage intelligent, coche verte au succès.',
      ],
      es: [
        'Navegación rediseñada: iconos de línea sustituyen a los emojis, la barra abraza exactamente la burbuja activa — y ahora puedes arrastrarla a lo largo de la barra para cambiar de vista.',
        'Una paleta afinada da por fin profundidad a la app: un oscuro más denso y cálido, cuatro niveles de superficie distintos, bordes más finos. El texto atenuado ya se lee bien en todas partes.',
        'Ajustes e Insignias se alinean con la página Cuenta: secciones identificadas por color e insignias bloqueadas reconocibles al instante.',
        'Inicio de sesión en la nube: el código se escribe en casillas animadas — avance automático, pegado inteligente, marca verde al validar.',
      ],
      zh: [
        '导航重新设计：线条图标取代表情符号，标签栏精确贴合当前圆珠——现在你还可以抓住圆珠沿栏滑动来切换页面。',
        '精修的配色终于带来层次感：更深、略暖的暗色，四个清晰的表面层级，更细的描边。淡色文字现在处处可读。',
        '设置与徽章向账户页看齐：分区以颜色标识，锁定的徽章一眼即可分辨。',
        '云登录：验证码在动画分格中输入——自动前进、智能粘贴、成功时显示绿色对勾。',
      ],
      it: [
        'Navigazione ridisegnata: icone a tratto al posto delle emoji, la barra abbraccia esattamente la pallina attiva — e ora puoi afferrarla e farla scorrere lungo la barra per cambiare vista.',
        'Una palette raffinata dà finalmente profondità all’app: uno scuro più denso e caldo, quattro livelli di superficie distinti, bordi più sottili. Il testo attenuato è leggibile ovunque.',
        'Impostazioni e Badge si allineano alla pagina Account: sezioni identificate da colori e badge bloccati riconoscibili a colpo d’occhio.',
        'Accesso cloud: il codice si digita in caselle animate — avanzamento automatico, incolla intelligente, spunta verde al successo.',
      ],
      nl: [
        'Vernieuwde navigatie: lijnpictogrammen vervangen de emoji, de balk omsluit de actieve knop precies — en je kunt de knop nu vastpakken en langs de balk schuiven om van weergave te wisselen.',
        'Een verfijnd palet geeft de app eindelijk diepte: een dieper, warmer donker, vier duidelijke oppervlakteniveaus en fijnere randen. Gedempte tekst is nu overal leesbaar.',
        'Instellingen en Badges sluiten aan op de Account-pagina: secties met kleurcodering en vergrendelde badges die je meteen herkent.',
        'Cloud-aanmelding: de code typ je in geanimeerde vakjes — automatisch doorschuiven, slim plakken, groen vinkje bij succes.',
      ],
      de: [
        'Neu gestaltete Navigation: Strich-Icons ersetzen die Emojis, die Leiste umschließt die aktive Perle exakt — und du kannst die Perle jetzt greifen und entlang der Leiste ziehen, um die Ansicht zu wechseln.',
        'Eine verfeinerte Palette gibt der App endlich Tiefe: ein dunkleres, wärmeres Schwarz, vier klar getrennte Flächenebenen, feinere Ränder. Gedämpfter Text ist überall lesbar.',
        'Einstellungen und Abzeichen ziehen mit der Konto-Seite gleich: farblich gekennzeichnete Bereiche und auf einen Blick erkennbare gesperrte Abzeichen.',
        'Cloud-Anmeldung: der Code wird in animierten Feldern getippt — Auto-Weiterschaltung, cleveres Einfügen, grüner Haken bei Erfolg.',
      ],
    },
  },
  {
    version: '1.23.0',
    date: '2026-08-07',
    changes: {
      en: [
        'New navigation: the active tab now floats in a sliding bead, and the bar curves around it as it glides from tab to tab.',
        'Cloud sign-in: the code is now typed in animated segmented boxes — auto-advance, smart paste, a green check on success.',
        'Settings and Badges got the Account-page polish: semantic color accents, clearer sections, and locked/unlocked badges you can tell apart at a glance.',
      ],
      fr: [
        'Nouvelle navigation : l’onglet actif flotte dans une pastille glissante, et la barre se creuse autour d’elle en épousant son déplacement.',
        'Connexion cloud : le code se saisit désormais dans des cases animées — avance automatique, collage intelligent, coche verte en cas de succès.',
        'Réglages et Badges reçoivent le soin de la page Compte : accents de couleur sémantiques, sections plus lisibles, et badges verrouillés/débloqués reconnaissables au premier coup d’œil.',
      ],
      es: [
        'Nueva navegación: la pestaña activa flota en una burbuja deslizante, y la barra se curva a su alrededor mientras se desplaza.',
        'Inicio de sesión en la nube: el código se escribe ahora en casillas animadas — avance automático, pegado inteligente, marca verde al validar.',
        'Ajustes e Insignias reciben el pulido de la página Cuenta: acentos de color semánticos, secciones más claras e insignias bloqueadas/desbloqueadas distinguibles al instante.',
      ],
      zh: [
        '全新导航：当前标签浮在一个滑动圆珠中，标签栏随其移动弯出贴合的凹槽。',
        '云登录：验证码现在在动画分格中输入——自动前进、智能粘贴、成功时显示绿色对勾。',
        '设置与徽章获得账户页同款打磨：语义色彩点缀、更清晰的分区，锁定/解锁徽章一眼可辨。',
      ],
      it: [
        'Nuova navigazione: la scheda attiva fluttua in una pallina scorrevole, e la barra si incurva attorno ad essa seguendone il movimento.',
        'Accesso cloud: il codice si digita ora in caselle animate — avanzamento automatico, incolla intelligente, spunta verde al successo.',
        'Impostazioni e Badge ricevono la cura della pagina Account: accenti di colore semantici, sezioni più leggibili e badge bloccati/sbloccati distinguibili a colpo d’occhio.',
      ],
      nl: [
        'Nieuwe navigatie: het actieve tabblad zweeft in een glijdende knop, en de balk buigt eromheen mee terwijl hij van tab naar tab glijdt.',
        'Cloud-aanmelding: de code typ je nu in geanimeerde vakjes — automatisch doorschuiven, slim plakken, groen vinkje bij succes.',
        'Instellingen en Badges kregen de Account-afwerking: semantische kleuraccenten, duidelijkere secties, en vergrendelde/ontgrendelde badges die je in één oogopslag herkent.',
      ],
      de: [
        'Neue Navigation: der aktive Tab schwebt in einer gleitenden Perle, und die Leiste wölbt sich um sie herum, während sie von Tab zu Tab gleitet.',
        'Cloud-Anmeldung: der Code wird jetzt in animierten Feldern getippt — Auto-Weiterschaltung, cleveres Einfügen, grüner Haken bei Erfolg.',
        'Einstellungen und Abzeichen erhielten den Konto-Feinschliff: semantische Farbakzente, klarere Bereiche und auf einen Blick unterscheidbare gesperrte/freigeschaltete Abzeichen.',
      ],
    },
  },
  {
    version: '1.22.0',
    date: '2026-08-06',
    changes: {
      en: [
        'New 👤 Account tab: cloud sync, backups (code + QR, export/import) and feedback now live together — with sign-out, email change, and a danger zone to delete your data (device, cloud or both) behind a typed confirmation.',
        'Collector tools moved into Stats: missing cards, doubles to trade and your trade list as clean tabbed lists — rarity chips, wishlist stars and copy counts included.',
      ],
      fr: [
        'Nouvel onglet 👤 Compte : la synchro cloud, les sauvegardes (code + QR, export/import) et les avis vivent désormais ensemble — avec déconnexion, changement d’email, et une zone danger pour supprimer tes données (appareil, cloud ou les deux) derrière une confirmation à retaper.',
        'Les outils de collectionneur déménagent dans Stats : cartes manquantes, doubles à échanger et liste d’échange en listes à onglets soignées — pastilles de rareté, étoiles wishlist et quantités incluses.',
      ],
      es: [
        'Nueva pestaña 👤 Cuenta: la sincronización en la nube, las copias (código + QR, exportar/importar) y las opiniones ahora viven juntas — con cierre de sesión, cambio de email y una zona de peligro para borrar tus datos (dispositivo, nube o ambos) tras una confirmación escrita.',
        'Las herramientas de coleccionista se mudan a Stats: cartas que faltan, repetidas para intercambiar y tu lista de intercambio en listas con pestañas — con chips de rareza, estrellas de wishlist y cantidades.',
      ],
      zh: [
        '全新 👤 账户标签页：云同步、备份（备份码 + 二维码、导出/导入）和反馈现在集中在一起——还有退出登录、更换邮箱，以及需要输入确认词的危险区域（可删除设备、云端或两者的数据）。',
        '收藏家工具移入统计页：缺少的卡、可交换的重复卡和交换清单以整洁的标签列表呈现——含稀有度徽章、愿望清单星标和数量。',
      ],
      it: [
        'Nuova scheda 👤 Account: sincronizzazione cloud, backup (codice + QR, esporta/importa) e feedback ora vivono insieme — con disconnessione, cambio email e una zona pericolo per eliminare i tuoi dati (dispositivo, cloud o entrambi) dietro una conferma digitata.',
        'Gli strumenti da collezionista si spostano in Stats: carte mancanti, doppioni da scambiare e la tua lista di scambio in liste a schede curate — con chip di rarità, stelle wishlist e quantità.',
      ],
      nl: [
        'Nieuw 👤 Account-tabblad: cloudsync, back-ups (code + QR, export/import) en feedback wonen nu samen — met uitloggen, e-mail wijzigen en een gevarenzone om je gegevens te wissen (apparaat, cloud of beide) achter een getypte bevestiging.',
        'De verzamelaarstools verhuizen naar Stats: ontbrekende kaarten, dubbelen om te ruilen en je ruillijst als nette lijsten met tabbladen — met zeldzaamheidschips, verlanglijst-sterren en aantallen.',
      ],
      de: [
        'Neuer 👤 Konto-Tab: Cloud-Sync, Backups (Code + QR, Export/Import) und Feedback wohnen jetzt zusammen — mit Abmelden, E-Mail-Änderung und einer Gefahrenzone zum Löschen deiner Daten (Gerät, Cloud oder beides) hinter einer getippten Bestätigung.',
        'Die Sammler-Werkzeuge ziehen in die Stats: fehlende Karten, Dubletten zum Tauschen und deine Tauschliste als saubere Listen mit Tabs — mit Seltenheits-Chips, Wunschlisten-Sternen und Stückzahlen.',
      ],
    },
  },
  {
    version: '1.21.1',
    date: '2026-08-06',
    changes: {
      en: [
        'Eternal polish: the ✦ stars found their final spots — they no longer overlap the crown, the + button or the card sheet’s close button.',
      ],
      fr: [
        'Finitions Éternel : les étoiles ✦ ont trouvé leur place définitive — elles ne chevauchent plus la couronne, le bouton + ni le ✕ de la fiche carte.',
      ],
      es: [
        'Retoques de Eterna: las estrellas ✦ encontraron su sitio definitivo — ya no se superponen a la corona, al botón + ni al ✕ de la ficha.',
      ],
      zh: [
        '永恒细节打磨：✦ 星星找到了最终位置——不再与王冠、+ 按钮或卡片详情的 ✕ 重叠。',
      ],
      it: [
        'Rifiniture di Eterna: le stelle ✦ hanno trovato la posizione definitiva — non si sovrappongono più alla corona, al pulsante + né alla ✕ della scheda.',
      ],
      nl: [
        'Eeuwig-afwerking: de ✦-sterren vonden hun definitieve plek — ze overlappen niet langer de kroon, de +-knop of de ✕ van de kaartfiche.',
      ],
      de: [
        'Ewig-Feinschliff: die ✦-Sterne haben ihren endgültigen Platz gefunden — sie überlappen nicht mehr die Krone, den +-Button oder das ✕ des Kartenblatts.',
      ],
    },
  },
  {
    version: '1.21.0',
    date: '2026-08-06',
    changes: {
      en: [
        'Add a card in one gesture: the new + button on each tile opens a small variant picker — one tap adds a copy, and “Undo” in the toast reverts it.',
        'The header now shows your progress (owned/total) with a thin progress line underneath, updated live.',
        'New top rarity: Eternal ✦ — own every variant of a card (complete set) to push its rarity one level up. Only champions can reach Eternal, with a golden glow, light sweep and sparkling stars.',
        'On complete sets, the copy indicators now only show variants you own more than once.',
      ],
      fr: [
        'Ajoute une carte en un geste : le nouveau bouton + de chaque tuile ouvre un petit sélecteur de variantes — un appui ajoute un exemplaire, « Annuler » dans le toast revient en arrière.',
        'Le header affiche désormais ta progression (possédées/total) avec un fin liseré de progression en dessous, mis à jour en direct.',
        'Nouvelle rareté suprême : Éternel ✦ — possède toutes les variantes d’une carte (set complet) pour faire monter sa rareté d’un cran. Seuls les champions peuvent atteindre Éternel, avec halo doré, rai de lumière et étoiles scintillantes.',
        'Sur les sets complets, les indicateurs d’exemplaires n’affichent plus que les variantes possédées en plusieurs fois.',
      ],
      es: [
        'Añade una carta con un gesto: el nuevo botón + de cada casilla abre un pequeño selector de variantes — un toque añade un ejemplar y «Deshacer» en el aviso lo revierte.',
        'La cabecera ahora muestra tu progreso (poseídas/total) con una fina línea de progreso debajo, actualizada al instante.',
        'Nueva rareza suprema: Eterna ✦ — posee todas las variantes de una carta (serie completa) para subir su rareza un nivel. Solo los campeones pueden alcanzar Eterna, con halo dorado, destello de luz y estrellas brillantes.',
        'En las series completas, los indicadores de ejemplares solo muestran las variantes que posees más de una vez.',
      ],
      zh: [
        '一步添加卡牌：每张卡格上新增的 + 按钮会打开一个小版本选择器——点一下即可添加一张，提示中的“撤销”可以还原。',
        '页眉现在会显示你的收藏进度（已拥有/总数），下方还有一条细进度线，实时更新。',
        '全新最高稀有度：永恒 ✦——集齐一张卡的所有版本（全套）可让其稀有度提升一级。只有冠军卡能达到永恒，拥有金色光晕、流光和闪烁星星。',
        '在全套卡组上，副本指示器现在只显示拥有多张的版本。',
      ],
      it: [
        'Aggiungi una carta con un gesto: il nuovo pulsante + su ogni tessera apre un piccolo selettore di varianti — un tocco aggiunge una copia e «Annulla» nel toast la ripristina.',
        'L’intestazione ora mostra i tuoi progressi (possedute/totale) con una sottile linea di avanzamento sotto, aggiornata in tempo reale.',
        'Nuova rarità suprema: Eterna ✦ — possiedi tutte le varianti di una carta (set completo) per far salire la sua rarità di un livello. Solo i campioni possono raggiungere Eterna, con alone dorato, fascio di luce e stelle scintillanti.',
        'Sui set completi, gli indicatori delle copie mostrano ora solo le varianti possedute più di una volta.',
      ],
      nl: [
        'Voeg een kaart toe met één gebaar: de nieuwe +-knop op elke tegel opent een kleine variantkiezer — één tik voegt een exemplaar toe, en “Ongedaan maken” in de melding draait het terug.',
        'De koptekst toont nu je voortgang (in bezit/totaal) met een dunne voortgangslijn eronder, live bijgewerkt.',
        'Nieuwe topzeldzaamheid: Eeuwig ✦ — bezit elke variant van een kaart (complete set) om de zeldzaamheid een niveau te verhogen. Alleen kampioenen kunnen Eeuwig bereiken, met gouden gloed, lichtstraal en fonkelende sterren.',
        'Bij complete sets tonen de exemplaarindicatoren nu alleen varianten die je meer dan één keer bezit.',
      ],
      de: [
        'Füge eine Karte mit einer Geste hinzu: der neue +-Button auf jeder Kachel öffnet eine kleine Variantenauswahl — ein Tipp fügt ein Exemplar hinzu, „Rückgängig“ im Toast macht es rückgängig.',
        'Der Header zeigt jetzt deinen Fortschritt (besessen/gesamt) mit einer feinen Fortschrittslinie darunter, live aktualisiert.',
        'Neue höchste Seltenheit: Ewig ✦ — besitze jede Variante einer Karte (komplettes Set), um ihre Seltenheit eine Stufe anzuheben. Nur Champions können Ewig erreichen, mit goldenem Schein, Lichtstreif und funkelnden Sternen.',
        'Bei kompletten Sets zeigen die Exemplar-Anzeigen jetzt nur noch Varianten, die du mehrfach besitzt.',
      ],
    },
  },
  {
    version: '1.20.0',
    date: '2026-08-06',
    changes: {
      en: [
        'Complete sets now stand out: once you own at least one copy of every variant of a card, its tile gets a subtle double ring and a small 🏁 badge — in the grid and on the card sheet.',
      ],
      fr: [
        'Les sets complets se distinguent désormais : dès que tu possèdes au moins un exemplaire de chaque variante d’une carte, sa tuile gagne un fin double liseré et un petit badge 🏁 — dans la grille et sur la fiche carte.',
      ],
      es: [
        'Las series completas ahora destacan: en cuanto posees al menos un ejemplar de cada variante de una carta, su casilla recibe un fino doble borde y una pequeña insignia 🏁 — en la cuadrícula y en la ficha de la carta.',
      ],
      zh: [
        '集齐的卡组现在更醒目：只要你拥有某张卡每个版本至少一张，它的卡格就会获得细腻的双重描边和一枚小小的 🏁 徽章——在网格和卡片详情中都可见。',
      ],
      it: [
        'I set completi ora si distinguono: appena possiedi almeno una copia di ogni variante di una carta, la sua tessera riceve un sottile doppio bordo e un piccolo badge 🏁 — nella griglia e nella scheda della carta.',
      ],
      nl: [
        'Complete sets vallen nu op: zodra je van elke variant van een kaart minstens één exemplaar bezit, krijgt de tegel een subtiele dubbele rand en een kleine 🏁-badge — in het raster en op de kaartfiche.',
      ],
      de: [
        'Komplette Sets stechen jetzt hervor: sobald du von jeder Variante einer Karte mindestens ein Exemplar besitzt, erhält ihre Kachel einen feinen Doppelrand und ein kleines 🏁-Abzeichen — im Raster und auf dem Kartenblatt.',
      ],
    },
  },
  {
    version: '1.19.0',
    date: '2026-08-06',
    changes: {
      en: [
        'A cleaner, quieter header: one slim rail with your title, the season and the card total neatly aligned — and more room for your collection on every screen size.',
      ],
      fr: [
        'Un header plus net et plus calme : une seule barre fine avec ton titre, la saison et le total de cartes bien alignés — et plus de place pour ta collection sur toutes les tailles d’écran.',
      ],
      es: [
        'Una cabecera más limpia y tranquila: una sola barra fina con tu título, la temporada y el total de cartas bien alineados — y más espacio para tu colección en cualquier pantalla.',
      ],
      zh: [
        '更简洁安静的页眉：一条纤细的横栏，整齐排列你的头衔、赛季和卡牌总数——在任何屏幕上都为收藏留出更多空间。',
      ],
      it: [
        'Un’intestazione più pulita e tranquilla: un’unica barra sottile con il tuo titolo, la stagione e il totale delle carte ben allineati — e più spazio per la tua collezione su ogni schermo.',
      ],
      nl: [
        'Een strakkere, rustigere header: één slanke balk met je titel, het seizoen en het kaarttotaal netjes uitgelijnd — en meer ruimte voor je collectie op elk schermformaat.',
      ],
      de: [
        'Eine klarere, ruhigere Kopfzeile: eine schlanke Leiste mit deinem Titel, der Saison und der Kartengesamtzahl sauber ausgerichtet — und mehr Platz für deine Sammlung auf jeder Bildschirmgröße.',
      ],
    },
  },
  {
    version: '1.18.0',
    date: '2026-08-04',
    changes: {
      en: [
        'Simpler collection view: the search bar and the filter panel are gone — the grid now always shows the whole collection, sorted by card number.',
        'The header counter now shows the total number of cards in the season.',
        'The guided tour was updated to match.',
      ],
      fr: [
        'Vue collection simplifiée : la barre de recherche et le panneau de filtres ont été retirés — la grille montre désormais toujours toute la collection, triée par numéro de carte.',
        'Le compteur du header affiche maintenant le nombre total de cartes de la saison.',
        'La visite guidée a été mise à jour en conséquence.',
      ],
      es: [
        'Vista de colección simplificada: la barra de búsqueda y el panel de filtros se han eliminado — la cuadrícula muestra ahora siempre toda la colección, ordenada por número de carta.',
        'El contador de la cabecera muestra ahora el número total de cartas de la temporada.',
        'La visita guiada se actualizó en consecuencia.',
      ],
      zh: [
        '收藏视图更简洁：搜索栏和筛选面板已移除——网格现在始终按卡号排序显示全部收藏。',
        '页眉计数器现在显示本赛季的卡牌总数。',
        '引导教程已相应更新。',
      ],
      it: [
        'Vista collezione semplificata: la barra di ricerca e il pannello dei filtri sono stati rimossi — la griglia mostra ora sempre l’intera collezione, ordinata per numero di carta.',
        'Il contatore nell’intestazione mostra ora il numero totale di carte della stagione.',
        'Il tour guidato è stato aggiornato di conseguenza.',
      ],
      nl: [
        'Eenvoudigere collectieweergave: de zoekbalk en het filterpaneel zijn verwijderd — het raster toont nu altijd de volledige collectie, gesorteerd op kaartnummer.',
        'De teller in de header toont nu het totale aantal kaarten van het seizoen.',
        'De rondleiding is hierop aangepast.',
      ],
      de: [
        'Einfachere Sammlungsansicht: die Suchleiste und das Filterpanel wurden entfernt — das Raster zeigt jetzt immer die ganze Sammlung, sortiert nach Kartennummer.',
        'Der Zähler in der Kopfzeile zeigt jetzt die Gesamtzahl der Karten der Saison.',
        'Die geführte Tour wurde entsprechend angepasst.',
      ],
    },
  },
  {
    version: '1.17.0',
    date: '2026-07-23',
    changes: {
      en: [
        'Smoother startup: the app no longer flashes the PIN screen for a moment when no PIN is set, and shows loading placeholders instead of an empty page while it starts.',
        'Fixed the “What’s new” panel, whose text was touching the edges.',
      ],
      fr: [
        'Démarrage plus doux : l’app n’affiche plus brièvement l’écran du code PIN quand aucun PIN n’est défini, et montre des blocs de chargement plutôt qu’une page vide pendant qu’elle démarre.',
        'Correction du panneau « Nouveautés », dont le texte touchait les bords.',
      ],
      es: [
        'Arranque más suave: la app ya no muestra por un instante la pantalla del PIN cuando no hay PIN configurado, y presenta marcadores de carga en lugar de una página vacía mientras arranca.',
        'Corregido el panel de «Novedades», cuyo texto tocaba los bordes.',
      ],
      zh: [
        '启动更顺畅：未设置 PIN 码时，应用不再短暂闪现 PIN 界面；启动过程中显示加载占位块，而非空白页面。',
        '修复了「新功能」面板文字紧贴边缘的问题。',
      ],
      it: [
        'Avvio più fluido: l’app non mostra più per un istante la schermata del PIN quando nessun PIN è impostato, e visualizza segnaposto di caricamento invece di una pagina vuota mentre si avvia.',
        'Corretto il pannello «Novità», il cui testo toccava i bordi.',
      ],
      nl: [
        'Vloeiendere start: de app toont niet langer even het pinscherm wanneer er geen pincode is ingesteld, en laat laadplaatshouders zien in plaats van een lege pagina tijdens het opstarten.',
        'Het paneel “Nieuw” hersteld, waarvan de tekst tegen de randen kwam.',
      ],
      de: [
        'Sanfterer Start: die App zeigt nicht mehr kurz den PIN-Bildschirm, wenn keine PIN gesetzt ist, und zeigt beim Starten Ladeplatzhalter statt einer leeren Seite.',
        'Das Panel „Neuigkeiten“ korrigiert, dessen Text die Ränder berührte.',
      ],
    },
  },
  {
    version: '1.16.0',
    date: '2026-07-22',
    changes: {
      en: [
        'On phones, the copies grid in the card sheet no longer runs off the edge — the fourth column stays visible.',
        'Spacing has been harmonised across the app for a steadier, more consistent rhythm.',
      ],
      fr: [
        'Sur téléphone, la grille des exemplaires de la fiche carte ne déborde plus — la quatrième colonne reste visible.',
        'Les espacements ont été harmonisés dans toute l’app, pour un rythme plus régulier.',
      ],
      es: [
        'En el móvil, la cuadrícula de ejemplares de la ficha ya no se sale del borde: la cuarta columna queda visible.',
        'Se han armonizado los espaciados en toda la aplicación, para un ritmo más regular.',
      ],
      zh: [
        '在手机上，卡牌详情中的收藏数量网格不再超出边缘——第四列始终可见。',
        '全应用的间距已统一，视觉节奏更加一致。',
      ],
      it: [
        'Su telefono, la griglia delle copie nella scheda carta non esce più dal bordo: la quarta colonna resta visibile.',
        'Le spaziature sono state armonizzate in tutta l’app, per un ritmo più regolare.',
      ],
      nl: [
        'Op de telefoon loopt het exemplarenraster in de kaartfiche niet meer buiten beeld — de vierde kolom blijft zichtbaar.',
        'De witruimte is in de hele app geharmoniseerd, voor een rustiger en consistenter ritme.',
      ],
      de: [
        'Auf dem Telefon läuft das Exemplar-Raster in der Kartenansicht nicht mehr über den Rand — die vierte Spalte bleibt sichtbar.',
        'Die Abstände wurden in der ganzen App vereinheitlicht, für einen ruhigeren, gleichmäßigeren Rhythmus.',
      ],
    },
  },
  {
    version: '1.15.0',
    date: '2026-07-22',
    changes: {
      en: [
        'The card sheet is easier to read: rarity now stands on its own line, and a new row shows at a glance whether the card is owned, a double, wishlisted or a favourite.',
        'The card number and category are no longer repeated further down the sheet, leaving more room for the figures that matter.',
      ],
      fr: [
        'La fiche carte se lit plus facilement : la rareté occupe désormais sa propre ligne, et une nouvelle rangée indique d’un coup d’œil si la carte est possédée, en double, en wishlist ou en favori.',
        'Le numéro et la catégorie ne sont plus répétés plus bas dans la fiche, ce qui laisse plus de place aux chiffres utiles.',
      ],
      es: [
        'La ficha de carta se lee mejor: la rareza ocupa ahora su propia línea y una nueva fila muestra de un vistazo si la carta está en propiedad, repetida, en la lista de deseos o en favoritos.',
        'El número y la categoría ya no se repiten más abajo en la ficha, dejando más espacio a las cifras que importan.',
      ],
      zh: [
        '卡牌详情更易阅读：稀有度现已独占一行，新增的状态行让你一眼看清该卡是否已拥有、重复、在愿望清单或收藏夹中。',
        '卡牌编号与类别不再在详情下方重复出现，为真正有用的数据留出更多空间。',
      ],
      it: [
        'La scheda della carta è più leggibile: la rarità ha ora una riga tutta sua e una nuova fila mostra a colpo d’occhio se la carta è posseduta, doppia, in wishlist o tra i preferiti.',
        'Numero e categoria non vengono più ripetuti più in basso nella scheda, lasciando più spazio ai dati che contano.',
      ],
      nl: [
        'De kaartfiche leest prettiger: de zeldzaamheid staat nu op een eigen regel en een nieuwe rij toont in één oogopslag of de kaart in bezit, dubbel, op de verlanglijst of favoriet is.',
        'Nummer en categorie worden niet meer verderop in de fiche herhaald, wat ruimte vrijmaakt voor de cijfers die ertoe doen.',
      ],
      de: [
        'Die Kartenansicht liest sich klarer: die Seltenheit steht jetzt in einer eigenen Zeile, und eine neue Reihe zeigt auf einen Blick, ob die Karte vorhanden, doppelt, auf der Wunschliste oder ein Favorit ist.',
        'Nummer und Kategorie werden weiter unten nicht mehr wiederholt — mehr Platz für die Zahlen, auf die es ankommt.',
      ],
    },
  },
  {
    version: '1.14.0',
    date: '2026-07-21',
    changes: {
      en: [
        'Rarity labels are now uniformly white on every level, for a cleaner and more consistent look across the whole collection.',
      ],
      fr: [
        'Les libellés de rareté sont désormais uniformément blancs sur tous les niveaux, pour un rendu plus net et plus cohérent sur toute la collection.',
      ],
      es: [
        'Las etiquetas de rareza ahora son uniformemente blancas en todos los niveles, para un aspecto más limpio y coherente en toda la colección.',
      ],
      zh: [
        '各稀有度标签现已统一为白色文字，使整个收藏的视觉更简洁、更一致。',
      ],
      it: [
        'Le etichette di rarità sono ora uniformemente bianche su tutti i livelli, per un aspetto più pulito e coerente su tutta la collezione.',
      ],
      nl: [
        'De zeldzaamheidslabels zijn nu op elk niveau uniform wit, voor een strakker en consistenter beeld in de hele collectie.',
      ],
      de: [
        'Die Seltenheitsbezeichnungen sind jetzt auf allen Stufen einheitlich weiß — für ein klareres, konsistenteres Bild in der ganzen Sammlung.',
      ],
    },
  },
  {
    version: '1.13.0',
    date: '2026-07-21',
    changes: {
      en: [
        'New rarity colours: legendary becomes a vivid gold, mythic a jade green and cosmic a deep indigo — each level is now easier to tell apart at a glance.',
        'The stats categories are recoloured too: doubles turn cyan, the wishlist pink, favourites a rosy coral.',
      ],
      fr: [
        'Nouvelles couleurs de rareté : légendaire passe en or vif, mythique en vert jade et cosmique en indigo profond — chaque niveau se distingue mieux d’un coup d’œil.',
        'Les catégories de stats sont recolorées aussi : les doubles passent en cyan, la wishlist en rose, les favoris en corail rosé.',
      ],
      es: [
        'Nuevos colores de rareza: legendaria pasa a un dorado vivo, mítica a verde jade y cósmica a índigo profundo — cada nivel se distingue mejor de un vistazo.',
        'Las categorías de estadísticas también cambian de color: las repetidas pasan a cian, la wishlist a rosa y los favoritos a coral rosado.',
      ],
      zh: [
        '全新稀有度配色：传奇改为鲜亮金色，神话改为翡翠绿，宇宙改为深靛蓝——各等级一眼即可区分。',
        '统计分类也重新配色：重复卡改为青色，愿望清单改为粉色，收藏夹改为玫瑰珊瑚色。',
      ],
      it: [
        'Nuovi colori di rarità: leggendaria diventa oro vivo, mitica verde giada e cosmica indaco profondo — ogni livello si distingue meglio a colpo d’occhio.',
        'Anche le categorie delle statistiche cambiano colore: i doppioni passano al ciano, la wishlist al rosa, i preferiti a un corallo rosato.',
      ],
      nl: [
        'Nieuwe zeldzaamheidskleuren: legendarisch wordt helder goud, mythisch jadegroen en kosmisch diep indigo — elk niveau is nu in één oogopslag te onderscheiden.',
        'Ook de statistiekcategorieën krijgen nieuwe kleuren: dubbelen worden cyaan, de verlanglijst roze en favorieten rozig koraal.',
      ],
      de: [
        'Neue Seltenheitsfarben: legendär wird leuchtendes Gold, mythisch ein Jadegrün und kosmisch ein tiefes Indigo — jede Stufe lässt sich jetzt auf einen Blick unterscheiden.',
        'Auch die Statistikkategorien werden umgefärbt: Dubletten werden cyan, die Wunschliste rosa, Favoriten ein rosiges Korall.',
      ],
    },
  },
  {
    version: '1.12.0',
    date: '2026-07-21',
    changes: {
      en: [
        'The legendary rarity gets a brighter, richer gold — far more striking than the old dark amber, and still perfectly readable.',
        'Wishlist changes colour: it is now magenta instead of gold, so it no longer gets confused with the legendary rarity.',
        'Stats tiles are clearer: favourites take the app’s red (like the heart on your cards) and missing cards turn a neutral slate — every category now has its own distinct colour.',
      ],
      fr: [
        'La rareté légendaire adopte un or plus vif et plus riche — bien plus éclatant que l’ambre foncé précédent, et toujours parfaitement lisible.',
        'La wishlist change de couleur : magenta au lieu du doré, elle ne se confond donc plus avec la rareté légendaire.',
        'Les tuiles de stats sont plus claires : les favoris prennent le rouge de l’app (comme le cœur sur vos cartes) et les manquantes passent en gris ardoise — chaque catégorie a désormais sa couleur propre.',
      ],
      es: [
        'La rareza legendaria estrena un dorado más vivo y rico — mucho más llamativo que el ámbar oscuro anterior, y sigue siendo perfectamente legible.',
        'La wishlist cambia de color: ahora es magenta en lugar de dorada, así que ya no se confunde con la rareza legendaria.',
        'Las tarjetas de estadísticas son más claras: los favoritos toman el rojo de la app (como el corazón de tus cartas) y las faltantes pasan a gris pizarra — cada categoría tiene ya su color propio.',
      ],
      zh: [
        '传奇稀有度换上更明亮、更浓郁的金色——比原先的暗琥珀色抢眼得多，且依然清晰易读。',
        '愿望清单换色：由金色改为洋红色，不再与传奇稀有度混淆。',
        '统计卡片更清晰：收藏夹采用应用的红色（与卡牌上的爱心一致），缺失卡改为中性石板灰——每个类别现在都有专属颜色。',
      ],
      it: [
        'La rarità leggendaria adotta un oro più vivo e ricco — molto più incisivo del vecchio ambra scuro, e sempre perfettamente leggibile.',
        'La wishlist cambia colore: ora è magenta anziché dorata, quindi non si confonde più con la rarità leggendaria.',
        'I riquadri delle statistiche sono più chiari: i preferiti prendono il rosso dell’app (come il cuore sulle tue carte) e le mancanti passano a un grigio ardesia — ogni categoria ha ora un colore tutto suo.',
      ],
      nl: [
        'De legendarische zeldzaamheid krijgt een helderder, rijker goud — veel opvallender dan het oude donkere amber, en nog steeds prima leesbaar.',
        'De verlanglijst verandert van kleur: nu magenta in plaats van goud, zodat verwarring met de legendarische zeldzaamheid verdwijnt.',
        'De statistiektegels zijn duidelijker: favorieten krijgen het rood van de app (net als het hartje op je kaarten) en ontbrekende kaarten worden leigrijs — elke categorie heeft nu een eigen kleur.',
      ],
      de: [
        'Die Seltenheit „legendär" erhält ein helleres, satteres Gold — deutlich markanter als das bisherige dunkle Bernstein und weiterhin gut lesbar.',
        'Die Wunschliste wechselt die Farbe: jetzt Magenta statt Gold, damit sie nicht mehr mit der legendären Seltenheit verwechselt wird.',
        'Die Statistikkacheln sind klarer: Favoriten übernehmen das Rot der App (wie das Herz auf deinen Karten) und fehlende Karten werden schiefergrau — jede Kategorie hat nun ihre eigene Farbe.',
      ],
    },
  },
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
