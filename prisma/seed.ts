/**
 * Seed Terra Nova with believable colony data.
 * Run with: npx prisma db seed   (or `npm run db:seed`)
 *
 * Demo accounts — password `password123`:
 *   citoyen@terranova.fr         → CITIZEN      (Amina Okafor)
 *   securite@terranova.fr        → SECURITY     (Sana Rhee)
 *   medical@terranova.fr         → MEDIC        (Dr Ilyas Voss)
 *   maintenance@terranova.fr     → MAINTENANCE  (Mateo Silva)
 *   transport@terranova.fr       → DRIVER       (Nadia Petrov)
 *   commerce@terranova.fr        → MERCHANT     (Yuki Tanaka)
 *   administration@terranova.fr  → ADMIN_AGENT  (Claire Fontaine)
 *   conseil@terranova.fr         → COUNCIL      (Elias Marr)
 *   iris.nouvelle (no email)     → CITIZEN      (Iris Halden, colon identifier)
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const DEMO_PASSWORD = "password123";

const USERS = [
  { email: "citoyen@terranova.fr", name: "Amina Okafor", role: "CITIZEN", sector: "Secteur 01 · Habitat", balance: 1240 },
  { email: "securite@terranova.fr", name: "Sana Rhee", role: "SECURITY", sector: "Secteur 04 · Rempart", balance: 0 },
  { email: "medical@terranova.fr", name: "Dr Ilyas Voss", role: "MEDIC", sector: "Secteur 02 · BioDôme", balance: 0 },
  { email: "maintenance@terranova.fr", name: "Mateo Silva", role: "MAINTENANCE", sector: "Secteur 05 · Industrie", balance: 0 },
  { email: "transport@terranova.fr", name: "Nadia Petrov", role: "DRIVER", sector: "Secteur 03 · Planitia", balance: 0 },
  { email: "commerce@terranova.fr", name: "Yuki Tanaka", role: "MERCHANT", sector: "Secteur 02 · BioDôme", balance: 0 },
  { email: "administration@terranova.fr", name: "Claire Fontaine", role: "ADMIN_AGENT", sector: "Centre civique", balance: 0 },
  { email: "conseil@terranova.fr", name: "Elias Marr", role: "COUNCIL", sector: "Centre civique", balance: 0 },
];

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const users: Record<string, { id: string }> = {};
  for (const user of USERS) {
    users[user.role] = await prisma.user.upsert({
      where: { email: user.email },
      update: { ...user, passwordHash },
      create: { ...user, passwordHash },
    });
  }

  // A resident who arrived without an email address (F71) — she signs in with
  // her colon identifier instead. Kept out of the role map on purpose.
  await prisma.user.upsert({
    where: { username: "iris.nouvelle" },
    update: { name: "Iris Halden", role: "CITIZEN" },
    create: {
      username: "iris.nouvelle",
      name: "Iris Halden",
      role: "CITIZEN",
      sector: "Secteur 01 · Habitat",
      balance: 0,
      passwordHash,
    },
  });

  const citizen = users.CITIZEN;
  const officer = users.SECURITY;
  const medic = users.MEDIC;
  const technician = users.MAINTENANCE;
  const driver = users.DRIVER;
  const merchant = users.MERCHANT;
  const adminAgent = users.ADMIN_AGENT;
  const council = users.COUNCIL;

  /* --- Civic services directory (D05) ---------------------------------- */
  const services = [
    { slug: "securite", name: "Sécurité publique", category: "Protection", icon: "🛡️", order: 1, featured: true, mapX: 0.574, mapY: 0.338, sector: "Secteur 04 · Rempart", description: "Ares Security Command veille sur les secteurs de la colonie : signalements, escorte et coordination des interventions.", preparation: "Munissez-vous de votre badge colon et d'une pièce d'identité." },
    { slug: "medical", name: "Soins médicaux", category: "Santé", icon: "✚", order: 2, featured: true, mapX: 0.443, mapY: 0.153, sector: "Secteur 02 · BioDôme", description: "Asclepius Medical Net assure le triage des urgences, les soins courants et l'accès aux modules médicaux.", preparation: "Apportez votre dossier médical et votre identifiant colon ; présentez-vous 10 minutes avant l'heure." },
    { slug: "maintenance", name: "Infrastructure", category: "Technique", icon: "🛠️", order: 3, featured: false, mapX: 0.269, mapY: 0.467, sector: "Secteur 05 · Industrie", description: "Hephaestus Infrastructure maintient le recyclage d'air, l'énergie, l'eau et la propreté des modules.", preparation: "Décrivez précisément la panne et notez les références du module concerné." },
    { slug: "transport", name: "Transport & logistique", category: "Mobilité", icon: "🚡", order: 4, featured: false, mapX: 0.295, mapY: 0.686, sector: "Secteur 03 · Planitia", description: "Hermes Mobility Net opère les rovers, les navettes et le fret entre les secteurs de Nova Terra.", preparation: "Indiquez votre adresse de départ, votre destination et prévoyez votre carte de transport." },
    { slug: "commerce", name: "Commerce & restauration", category: "Vie quotidienne", icon: "🍜", order: 5, featured: false, mapX: 0.546, mapY: 0.728, sector: "Secteur 01 · Habitat", description: "Mercator Exchange réunit les cantines et fournisseurs de la colonie : commandes et livraisons.", preparation: "Notez la liste de vos articles et votre numéro de module pour la livraison." },
    { slug: "demarches", name: "Démarches administratives", category: "Administration", icon: "📄", order: 6, featured: true, mapX: 0.689, mapY: 0.469, sector: "Secteur 03 · Planitia", description: "Permis, autorisations et documents officiels traités par le Bureau des démarches.", preparation: "Rassemblez les justificatifs demandés (identité, attestation de résidence) avant votre venue." },
  ];
  for (const service of services) {
    await prisma.municipalService.upsert({ where: { slug: service.slug }, update: service, create: service });
  }

  /* --- Council announcements (D06) ------------------------------------- */
  const announcements = [
    { slug: "colonisation-phase-deux", title: "Phase deux de colonisation : ouverture du Secteur 05", excerpt: "Le Haut Conseil ouvre les attributions de logements du Secteur 05.", body: "Habitants de Nova Terra,\n\nLa phase deux de colonisation ouvre le Secteur 05 aux nouvelles familles. Les demandes d'attribution se font depuis le Bureau des démarches, rubrique Logement.\n\nLe Haut Conseil de Nova Terra.", published: true, publishedAt: new Date("2026-10-01T08:00:00Z") },
    { slug: "maintenance-recyclage-air", title: "Maintenance planifiée du recyclage d'air", excerpt: "Interruption de courte durée sur le module HAB 07.", body: "Une maintenance planifiée du recyclage d'air aura lieu sur le module HAB 07. Les équipes Hephaestus interviendront hors cycle de sommeil.", published: true, publishedAt: new Date("2026-10-02T09:30:00Z") },
    { slug: "campagne-vaccination", title: "Campagne de vaccination saisonnière", excerpt: "Asclepius Medical Net ouvre des créneaux dans tous les secteurs.", body: "La campagne de vaccination saisonnière débute cette semaine. Présentez-vous au module médical de votre secteur avec votre identifiant colon.", published: true, publishedAt: new Date("2026-10-03T07:15:00Z") },
  ];
  for (const announcement of announcements) {
    await prisma.announcement.upsert({
      where: { slug: announcement.slug },
      update: { ...announcement, authorId: council.id },
      create: { ...announcement, authorId: council.id },
    });
  }

  /* --- General broadcast (announcement to everyone) -------------------- */
  await prisma.broadcast.deleteMany({});
  await prisma.broadcast.createMany({
    data: [
      {
        title: "Tempête de poussière — confinement temporaire",
        message:
          "Une tempête de poussière approche du Secteur 01. Confinez-vous dans les modules habitables jusqu'à nouvel ordre.",
        actionLabel: "Consulter les consignes",
        actionHref: "/announcements",
        startsAt: new Date("2026-10-01T00:00:00Z"),
        endsAt: null,
        active: true,
        authorId: council.id,
      },
    ],
  });

  /* --- Consultations & opinions (F65) ---------------------------------- */
  await prisma.opinion.deleteMany({});
  await prisma.consultation.deleteMany({});
  const consultation = await prisma.consultation.create({
    data: {
      slug: "extension-secteur-05",
      title: "Extension du Secteur 05",
      summary: "Faut-il prioriser l'extension des modules d'habitation du Secteur 05 ?",
      description:
        "Le Haut Conseil étudie l'extension des modules d'habitation du Secteur 05 pour accueillir de nouvelles familles. Donnez votre avis : ce retour est consultatif et n'a pas valeur de vote officiel.",
      status: "OPEN",
      published: true,
      anonymous: false,
      authorId: council.id,
    },
  });
  await prisma.opinion.create({
    data: {
      reference: "OPN-501",
      consultationId: consultation.id,
      authorId: citizen.id,
      stance: "SUPPORT",
      comment:
        "Je suis favorable à l'extension : de nouvelles familles dynamiseront le secteur et les services de proximité.",
    },
  });

  // A closed consultation: contributions anonymised, outcome readable.
  const closedConsultation = await prisma.consultation.create({
    data: {
      slug: "regulation-vols-drones",
      title: "Régulation des vols de drones",
      summary: "Faut-il restreindre les vols de drones de loisir au-dessus des quartiers habités ?",
      description:
        "Le Haut Conseil a consulté les habitants sur la régulation des vols de drones au-dessus des modules d'habitation. La consultation est désormais clôturée : le résultat retenu est publié ci-dessous.",
      status: "CLOSED",
      published: true,
      anonymous: true,
      outcome:
        "Après analyse des avis, le Haut Conseil restreint les vols de drones de loisir au-dessus des quartiers habités et maintient une voie d'accès prioritaire pour les services d'urgence. La règle entre en vigueur au prochain cycle.",
      authorId: council.id,
    },
  });
  await prisma.opinion.create({
    data: {
      reference: "OPN-502",
      consultationId: closedConsultation.id,
      authorId: citizen.id,
      stance: "SUPPORT",
      comment:
        "Les nuisances sonores sont réelles : une restriction des vols de loisir me semble raisonnable.",
    },
  });

  /* --- Reports (signalements) ------------------------------------------ */
  const reports = [
    { reference: "INC-042", type: "SECURITY", title: "Alerte intrusion airlock", description: "Détection d'une ouverture non autorisée sur le sas du Secteur 04. Aucun badge enregistré.", priority: "CRITICAL", status: "EN_ROUTE", sector: "Secteur 04 · Rempart", unit: "ARES-04", assigneeId: officer.id },
    { reference: "INC-029", type: "SECURITY", title: "Mouvement de rover non enregistré", description: "Un rover circule sur la boucle de service est sans transpondeur actif.", priority: "HIGH", status: "IN_PROGRESS", sector: "Secteur 03 · Planitia", unit: "ARES-02", assigneeId: officer.id },
    { reference: "MED-118", type: "MEDICAL", title: "Symptômes de décompression (EVA)", description: "Colon revenu d'EVA avec douleurs articulaires et vertiges. Triage prioritaire.", priority: "CRITICAL", status: "IN_PROGRESS", sector: "Secteur 02 · BioDôme", unit: "ASC-01", assigneeId: medic.id },
    { reference: "MED-116", type: "MEDICAL", title: "Fracture du poignet suspectée", description: "Chute dans le module de transit, immobilisation en cours.", priority: "HIGH", status: "ASSIGNED", sector: "Secteur 03 · Planitia", unit: "ASC-03", assigneeId: medic.id },
    { reference: "MNT-482", type: "MAINTENANCE", title: "Vibration du recycleur d'air", description: "Vibration anormale du recycleur du module HAB 07 depuis le cycle précédent.", priority: "HIGH", status: "IN_PROGRESS", sector: "Secteur 01 · Habitat", unit: "HEP-07", assigneeId: technician.id },
    { reference: "MNT-477", type: "MAINTENANCE", title: "Dérive thermique du bus d'énergie", description: "Température du bus principal en hausse sur le champ solaire B.", priority: "CRITICAL", status: "EN_ROUTE", sector: "Secteur 05 · Industrie", unit: "HEP-02", assigneeId: technician.id },
    { reference: "CLN-014", type: "CLEANLINESS", title: "Déchets accumulés au quai C", description: "Conteneurs pleins au quai de déchargement, risque de contamination.", priority: "NORMAL", status: "OPEN", sector: "Secteur 05 · Industrie", unit: null, assigneeId: null },
    { reference: "INC-038", type: "SECURITY", title: "Différend au marché central", description: "Altercation verbale signalée puis résolue par la patrouille.", priority: "NORMAL", status: "CLOSED", sector: "Secteur 02 · BioDôme", unit: "ARES-01", assigneeId: officer.id },
  ];

  for (const report of reports) {
    await prisma.report.upsert({
      where: { reference: report.reference },
      update: { ...report },
      create: {
        ...report,
        authorId: citizen.id,
        events: {
          create: {
            status: "OPEN",
            note: "Signalement transmis par un colon.",
            actorId: citizen.id,
          },
        },
      },
    });
  }

  /* --- A filed police case on the closed incident ---------------------- */
  const closedIncident = await prisma.report.findUniqueOrThrow({ where: { reference: "INC-038" } });
  await prisma.policeCase.upsert({
    where: { reportId: closedIncident.id },
    update: {},
    create: {
      reportId: closedIncident.id,
      officerId: officer.id,
      suspectName: "K. Doran",
      arrestNotes: "Rappel à l'ordre, aucun dommage constaté. Différend résolu sur place.",
      fineAmount: 40,
      pvContent: "PV simulé ARES-2026-0031 — trouble à l'ordre sur le marché central.",
      status: "FILED",
    },
  });

  /* --- Orders: taxi + restauration ------------------------------------- */
  const orders = [
    { reference: "TRN-118", type: "TAXI", status: "IN_TRANSIT", summary: "Rover TX-22 · Habitat 07 → BioDôme 03", total: 12, etaMinutes: 8, origin: "Habitat 07", destination: "BioDôme 03", providerId: driver.id },
    { reference: "COM-084", type: "FOOD", status: "PREPARING", summary: "Souper hydroponique · cuisine des Communs", total: 18, etaMinutes: 24, origin: "Commons Kitchen", destination: null, providerId: merchant.id },
    { reference: "COM-079", type: "FOOD", status: "COMPLETED", summary: "Bol de céréales Redleaf", total: 14, etaMinutes: null, origin: "Commons Kitchen", destination: null, providerId: merchant.id },
  ];
  for (const order of orders) {
    await prisma.order.upsert({
      where: { reference: order.reference },
      update: { ...order },
      create: { ...order, customerId: citizen.id },
    });
  }

  /* --- Rendez-vous (F40) ---------------------------------------------- */
  const medicalService = await prisma.municipalService.findUnique({ where: { slug: "medical" } });
  const demarchesService = await prisma.municipalService.findUnique({ where: { slug: "demarches" } });
  const appointmentCount = await prisma.appointment.count();
  if (appointmentCount === 0 && medicalService && demarchesService) {
    const soon = new Date(Date.now() + 3 * 60 * 60 * 1000);
    const later = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const appointments = [
      { reference: "APT-0001", serviceId: medicalService.id, subject: "Vaccination saisonnière", date: soon, sector: medicalService.sector ?? null, preparation: medicalService.preparation ?? null },
      { reference: "APT-0002", serviceId: demarchesService.id, subject: "Retrait attestation de résidence", date: later, sector: demarchesService.sector ?? null, preparation: demarchesService.preparation ?? null },
    ];
    for (const appointment of appointments) {
      await prisma.appointment.create({
        data: { ...appointment, citizenId: citizen.id },
      });
    }
  }

  /* --- Notifications + wallet ------------------------------------------ */
  await prisma.notification.deleteMany({ where: { userId: citizen.id } });
  await prisma.notification.createMany({
    data: [
      { userId: citizen.id, title: "Incident INC-042 pris en charge", body: "Une patrouille Ares est en route vers le Secteur 04.", href: "/citizen/reports", read: false },
      { userId: citizen.id, title: "Course TRN-118 confirmée", body: "Rover TX-22 · arrivée estimée dans 8 minutes.", href: "/citizen/orders", read: false },
      { userId: citizen.id, title: "Commande COM-084 en préparation", body: "Mercator Exchange prépare votre commande.", href: "/citizen/orders", read: true },
      { userId: citizen.id, title: "Nouvelle annonce du Haut Conseil", body: "Ouverture du Secteur 05 aux nouvelles familles.", href: "/announcements", read: true },
    ],
  });

  await prisma.walletTransaction.deleteMany({ where: { userId: citizen.id } });
  await prisma.walletTransaction.createMany({
    data: [
      { userId: citizen.id, label: "Allocation civique — Sol 0418", amount: 120 },
      { userId: citizen.id, label: "Course Hermes TRN-118", amount: -12 },
      { userId: citizen.id, label: "Commande Mercator COM-084", amount: -18 },
      { userId: citizen.id, label: "Remboursement fournitures", amount: 35 },
    ],
  });

  /* --- Démarches administratives (D03 / F22) --------------------------- */
  const requests = [
    { reference: "REQ-2026-0001", subject: "Demande d'attribution — Secteur 05", description: "Nous souhaitons candidater pour un logement familial en phase deux.", category: "Logement", priority: "HIGH", status: "IN_REVIEW" },
    { reference: "REQ-2026-0002", subject: "Permis de conduire rover (classe B)", description: "Demande d'habilitation pour conduire les rovers pressurisés.", category: "Permis", priority: "NORMAL", status: "IN_PROGRESS" },
    { reference: "REQ-2026-0003", subject: "Attestation de résidence", description: "Attestation nécessaire pour un dossier administratif.", category: "Documents", priority: "LOW", status: "RESOLVED" },
  ];
  for (const request of requests) {
    await prisma.serviceRequest.upsert({
      where: { reference: request.reference },
      update: { ...request, assigneeId: adminAgent.id },
      create: {
        ...request,
        authorId: citizen.id,
        assigneeId: adminAgent.id,
        history: { create: { status: "SUBMITTED", note: "Demande déposée par le colon.", actorId: citizen.id } },
      },
    });
  }

  /* --- Contact message (D04) ------------------------------------------- */
  const messageCount = await prisma.contactMessage.count();
  if (messageCount === 0) {
    await prisma.contactMessage.create({
      data: {
        reference: "MSG-2026-0001",
        subject: "Horaires de la navette Hermes",
        body: "Bonjour, quels sont les horaires de la navette entre Habitat 07 et le BioDôme ?",
        email: "citoyen@terranova.fr",
        authorId: citizen.id,
        status: "RECEIVED",
      },
    });
  }

  /* --- Messagerie ------------------------------------------------------- */
  const msgCount = await prisma.message.count();
  if (msgCount === 0) {
    await prisma.message.createMany({
      data: [
        { channel: "securite", content: "Patrouille ARES-04 engagée sur INC-042.", senderId: officer.id },
        { channel: "maintenance", content: "Intervention recycleur HAB 07 programmée ce cycle.", senderId: technician.id },
      ],
    });
  }

  /* --- Security audit trail (F69) --------------------------------------- */
  // Demo rows so the Council security console has something to analyse on a
  // fresh database; live events are appended by the platform at runtime.
  const activeIncident = await prisma.report.findUnique({ where: { reference: "INC-042" } });
  await prisma.securityEvent.deleteMany({});
  await prisma.botGuardToken.deleteMany({});
  await prisma.securityEvent.createMany({
    data: [
      {
        type: "LOGIN_FAILED",
        outcome: "DENIED",
        detail: "Échec de connexion · inconnu@terranova.fr",
        ip: "10.42.0.17",
        userAgent: "Mozilla/5.0 (démo)",
      },
      {
        type: "LOGIN_BLOCKED",
        outcome: "DENIED",
        detail: "Connexion bloquée · inconnu@terranova.fr",
        ip: "10.42.0.17",
        userAgent: "Mozilla/5.0 (démo)",
      },
      {
        type: "ACCESS_DENIED",
        outcome: "DENIED",
        actorId: citizen.id,
        actorRole: "CITIZEN",
        detail: "page COUNCIL · rôle CITIZEN",
        ip: "10.42.0.31",
        userAgent: "Mozilla/5.0 (démo)",
      },
      {
        type: "INPUT_NEUTRALIZED",
        outcome: "FLAGGED",
        detail: "signalement · description",
        ip: "10.42.0.31",
        userAgent: "Mozilla/5.0 (démo)",
      },
      {
        type: "FORM_BLOCKED",
        outcome: "FLAGGED",
        targetType: "form",
        targetId: "contact",
        detail: "Envoi bloqué · contact · raison tooFast",
        ip: "10.42.0.99",
        userAgent: "python-requests/2.32",
      },
      ...(activeIncident
        ? [
            {
              type: "REPORT_STATUS_CHANGED",
              outcome: "SUCCESS",
              actorId: officer.id,
              actorRole: "SECURITY",
              targetType: "report",
              targetId: activeIncident.id,
              detail: "nouveau statut EN_ROUTE",
            },
          ]
        : []),
    ],
  });

  /* --- Dev panel: Webcup needs tracked as tickets ---------------------- */
  const tickets = [
    { code: "D01", title: "Inscription / création de compte habitant", difficulty: "Facile", level: 1, xp: 250, status: "DONE", assignee: "Neisan", sortOrder: 1, wave: 0, isAi: false },
    { code: "D03", title: "Connexion + espace personnel", difficulty: "Facile", level: 1, xp: 250, status: "DONE", assignee: "Neisan", sortOrder: 2, wave: 0, isAi: false },
    { code: "D04", title: "Contact administration (formulaire + accusé)", difficulty: "Facile", level: 1, xp: 250, status: "REVIEW", assignee: "Neisan", sortOrder: 3, wave: 0, isAi: false },
    { code: "D05", title: "Présentation des services municipaux", difficulty: "Facile", level: 1, xp: 250, status: "DONE", assignee: null, sortOrder: 4, wave: 0, isAi: false },
    { code: "D06", title: "Publications / annonces municipales", difficulty: "Facile", level: 1, xp: 250, status: "DONE", assignee: null, sortOrder: 5, wave: 0, isAi: false },
    { code: "F22", title: "Vue des demandes habitants avec états", difficulty: "Facile", level: 1, xp: 250, status: "IN_PROGRESS", assignee: "Neisan", sortOrder: 6, wave: 0, isAi: false },
    { code: "D07", title: "Page d'accueil claire et hiérarchisée", difficulty: "Moyenne", level: 2, xp: 500, status: "DONE", assignee: null, sortOrder: 7, wave: 0, isAi: false },
    { code: "D08", title: "Rôles : citoyen / agent / admin", difficulty: "Moyenne", level: 2, xp: 500, status: "DONE", assignee: null, sortOrder: 8, wave: 0, isAi: false },
    { code: "D09", title: "Permissions / accès différenciés", difficulty: "Moyenne", level: 2, xp: 500, status: "IN_PROGRESS", assignee: "Neisan", sortOrder: 9, wave: 0, isAi: false },
    { code: "D19", title: "Espace agents avec vue sur les données API", difficulty: "Difficile", level: 3, xp: 750, status: "TODO", assignee: null, sortOrder: 10, wave: 0, isAi: false },
  ];

  for (const ticket of tickets) {
    await prisma.ticket.upsert({
      where: { code: ticket.code },
      update: { ...ticket },
      create: {
        ...ticket,
        description:
          "Besoin publié par l'API Webcup. Utilisez « Synchroniser » dans le panneau dev pour rafraîchir la description officielle.",
        group: "Socle",
        requester: "Ville de Nova Terra",
        requesterType: "Institution",
      },
    });
  }

  const f22 = await prisma.ticket.findUnique({ where: { code: "F22" } });
  if (f22) {
    await prisma.ticketComment.create({
      data: { ticketId: f22.id, author: "Neisan", kind: "COMMENT", body: "Filtre « à traiter » livré, reste à brancher le temps réel." },
    });
  }
  const d19 = await prisma.ticket.findUnique({ where: { code: "D19" } });
  if (d19) {
    await prisma.ticketComment.create({
      data: { ticketId: d19.id, author: "Neisan", kind: "COMMENT", body: "Bloqué en attendant la confirmation de l'API Nova Terra côté organisateurs." },
    });
  }

  console.log("✅ Terra Nova ecosystem seeded.");
  for (const user of USERS) console.log(`   ${user.email.padEnd(30)} ${user.role}`);
  console.log(`   ${"iris.nouvelle (sans e-mail)".padEnd(30)} CITIZEN`);
  console.log(`   mot de passe : ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
