/* All the copy lives here, so adding a treatment / slide / step is a one-line change.
   Clinic: Dr. Thaj Homoeo Clinic, Minjur, Chennai. */

export const NAV_LINKS = [
  { href: '#treatments', label: 'Treatments' },
  { href: '#doctors', label: 'Doctor' },
  { href: '#journey', label: 'Journey' },
];

/* Hero stat counters — only figures taken from the clinic's Justdial listing */
export const STATS = [
  { count: 1175, suffix: '+', label: 'Conditions treated' },
  { count: 4.9, suffix: '', label: 'Average ratings' },
  { count: 6, suffix: '', label: 'Days a week' },
];

/* Clinic photos in /public/assets/hero-images — the About section uses the first four (one per card),
   the booking panel uses the second. Swap files or reorder here. */
export const GALLERY = [
  '/assets/hero-images/clinicImg4.webp',
  '/assets/hero-images/clinicImg7.webp',
  '/assets/hero-images/clinicImg8.webp',
  '/assets/hero-images/clinicImg9.webp',
];

/* `conditions` = the full list shown when a visitor hovers a department card (desktop) or taps "All conditions" (phones).
   DRAFT for the doctor to review: it is built from the services already on the site (Justdial listing, FAQ, results)
   plus a few obvious related ones marked "// confirm". Delete or add lines freely; the card shows them in this order. */
export const TREATMENT_CATEGORIES = [
  { id: 'metabolic', label: 'Metabolic & hormonal', conditions: [
    'Hypothyroidism', 'Hyperthyroidism', 'Goiter (enlarged thyroid)', 'Weight loss counselling', 'Nutrition counselling',
    'High cholesterol', 'High triglycerides', 'High uric acid',
    'Diabetes care',   // confirm
  ] },
  { id: 'family', label: 'Women, children & wellness', conditions: [
    'Irregular menses', 'Fibroid uterus', 'Fibroadenoma', 'Infertility', 'Male infertility', 'Fertility counselling',
    'PCOD / PCOS',   // confirm
    'Pediatric care', 'Mumps', 'De-worming', 'Child counselling',
  ] },
  { id: 'skin', label: 'Skin, hair & wound care', conditions: [
    'Eczema', 'Psoriasis', 'Drug allergy', 'Shingles', 'Hair loss',
    'Acne', 'Fungal infections',   // confirm
    'Wound dressing', 'First aid', 'Diabetic foot ulcers', 'Periodic foot care',
  ] },
  { id: 'pain', label: 'Pain & mind', conditions: [
    'Migraine', 'Headache', 'Joint pain', 'Stiffness & swelling', 'Gouty arthritis', 'Knee pain', 'Muscle pain', 'Fibromyalgia',
    'Online counselling', 'Couples therapy', 'ADHD', 'Dementia',
    'Stress & anxiety',   // confirm
  ] },
  { id: 'systems', label: 'Body systems', conditions: [
    'Asthma', 'Bronchitis', 'Cough', 'Tonsillitis', 'Nebulization therapy',
    'Heartburn', 'Indigestion', 'Gastritis', 'Hyperacidity', 'IBS', 'Fatty liver', 'Fissure in ano', 'Jaundice',
    'Kidney stone', 'Gall bladder stone', 'Cystitis',
    'Gynaecological, cervical, gall bladder & genito-urinary cancer care',
  ] },
];

export const TREATMENTS = [
  { cat: 'metabolic', img: 'treatment7.webp', chip: 'Thyroid', title: 'Thyroid Care', sub: 'Hypothyroidism, Hyperthyroidism, Goiter (Enlarged Thyroid)' },
  { cat: 'metabolic', img: 'treatment1.webp', chip: 'Weight', title: 'Weight Loss Counselling' },
  { cat: 'metabolic', img: 'treatment18.webp', chip: 'Nutrition', title: 'Nutrition Counselling' },
  { cat: 'metabolic', img: 'treatment2.webp', chip: 'Metabolic', title: 'Cholesterol & Uric Acid', sub: 'Hypercholesterolemia, Hypertriglyceridemia, Hyperuricemia' },
  { cat: 'family', img: 'treatment9.webp', chip: 'Women’s health', title: 'Women’s Care', sub: 'Irregular Menses, Fibroid Uterus, Fibroadenoma, Infertility' },
  { cat: 'family', img: 'treatment10.webp', chip: 'Children', title: 'Child Health', sub: 'Pediatric Care, Mumps, Child Counselling, De-Worming' },
  { cat: 'family', img: 'treatment6.webp', chip: 'Fertility', title: 'Fertility Counselling', sub: 'Fertility counselling services, Male Infertility' },
  { cat: 'skin', img: 'treatment8.webp', chip: 'Skin', title: 'Skin Conditions', sub: 'Eczema, Psoriasis, Drug Allergy' },
  { cat: 'skin', img: 'treatment17.webp', chip: 'Hair', title: 'Hair Care', sub: 'Hair Loss' },
  { cat: 'skin', img: 'treatment19.webp', chip: 'Wound care', title: 'Wound Care & Diabetic Foot', sub: 'Wound Dressing, First Aid, Diabetic Foot Ulcers, Periodic Foot Care' },
  { cat: 'pain', img: 'treatment3.webp', chip: 'Pain', title: 'Migraine & Headache Management' },
  { cat: 'pain', img: 'treatment14.webp', chip: 'Joints', title: 'Joint & Muscle Pain', sub: 'Joint Pain, Stiffness & Swelling, Gouty Arthritis, Knee Pain, Muscle Pain, Fibromyalgia' },
  { cat: 'pain', img: 'treatment15.webp', chip: 'Mind', title: 'Counselling & Mental Wellness', sub: 'Online Counselling, Couples Therapy, ADHD, Dementia' },
  { cat: 'systems', img: 'treatment11.webp', chip: 'Respiratory', title: 'Asthma & Respiratory Care', sub: 'Asthma, Bronchitis, Cough, Tonsillitis, Nebulization Therapy' },
  { cat: 'systems', img: 'treatment12.webp', chip: 'Digestive', title: 'Digestive Health', sub: 'Heart Burn, Indigestion, Gastritis, Hyperacidity, IBS, Fatty Liver, Fissure in Ano' },
  { cat: 'systems', img: 'treatment16.webp', chip: 'Stones', title: 'Kidney & Gall Bladder Stones', sub: 'Kidney Stone, Gall Bladder Stone, Cystitis' },
  { cat: 'systems', img: 'treatment13.webp', chip: 'Tumors', title: 'Cancer & Tumor Care', sub: 'Gynaecological, Cervical, Gall Bladder & Genito-Urinary Cancer' },
];

/* How many tiles each category shows → which size recipe fills the 2-row grid */
export const BENTO_LAYOUTS = {
  4: ['xl', '', '', 'wide'],
  3: ['xl', 'wide', 'wide'],
  2: ['xl', 'xl'],
};

export const QUALIFICATIONS = [
  { title: 'B.H.M.S', desc: 'Bachelor of Homoeopathic Medicine & Surgery' },
  { title: 'M.Sc Psychology', desc: 'Master of Science in Psychology' },
  { title: 'Govt Reg. No. 7879A', desc: 'Registered homoeopathic practitioner' },
];

export const CARE_AREAS = [
  {
    title: 'Metabolic & Hormonal',
    chips: ['Thyroid care', 'Weight loss counselling', 'Nutrition counselling'],
    icon: ['M12 3c3.5 4 6 7 6 10.5a6 6 0 0 1-12 0C6 10 8.5 7 12 3z', 'M9.5 14a2.5 2.5 0 0 0 2.5 2.5'],
  },
  {
    title: 'Women & Children',
    chips: ['Pediatric care', 'Women’s care', 'Fertility counselling'],
    icon: ['M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z'],
  },
  {
    title: 'Counselling & Wellbeing',
    chips: ['Online counselling', 'Couples therapy', 'Child counselling', 'ADHD'],
    icon: ['M5 19c0-9 5-14 14-14 0 9-5 14-14 14z', 'M5 19c3-4 6-7 10-9'],
  },
];

export const JOURNEY = [
  { title: 'Book', img: 'journey1.webp' },
  { title: 'Consult', img: 'journey2.webp' },
  { title: 'Diagnose', img: 'journey3.webp' },
  { title: 'Treat', img: 'journey4.webp' },
  { title: 'Recover', img: 'journey5.webp' },
];

/* Booking form */
export const SERVICES = [
  'General Consultation', 'Thyroid Care', 'Pediatric Care', 'Women’s Care', 'Fertility Counselling',
  'Weight Loss Counselling', 'Nutrition Counselling', 'Online Counselling', 'Joint & Muscle Pain',
  'Asthma & Respiratory Care', 'Digestive Disorders', 'Skin Conditions', 'Wound Care & Diabetic Foot',
];

/* Monday – Saturday, 10:00 AM – 1:00 PM and 6:00 PM – 10:00 PM (last slots 12:30 PM and 9:30 PM). Closed on Sundays. */
export const TIME_SLOTS = [
  { time: '10:00', label: '10:00 AM' }, { time: '10:30', label: '10:30 AM' },
  { time: '11:00', label: '11:00 AM' }, { time: '11:30', label: '11:30 AM' },
  { time: '12:00', label: '12:00 PM' }, { time: '12:30', label: '12:30 PM' },
  { time: '18:00', label: '6:00 PM' }, { time: '18:30', label: '6:30 PM' },
  { time: '19:00', label: '7:00 PM' }, { time: '19:30', label: '7:30 PM' },
  { time: '20:00', label: '8:00 PM' }, { time: '20:30', label: '8:30 PM' },
  { time: '21:00', label: '9:00 PM' }, { time: '21:30', label: '9:30 PM' },
];

/* Contact */
export const CLINIC_NAME = 'Dr. Thaj Homoeo Clinic';
export const ADDRESS = '1/7, D.K.R. Complex, Near Railway Station, Bakthavatchalam Street, Minjur, Chennai - 601203, Tamil Nadu';
export const PHONES = [
  { display: '97910 23254', tel: '+919791023254' },
  { display: '93617 08870', tel: '+919361708870' },
];
export const WA_NUMBER = '919791023254'; // country code + number, no "+", spaces or dashes — bookings go here
export const MAPS_URL = 'https://www.google.com/maps/search/?api=1&query=Dr.+Thaj+Homoeo+Clinic+Minjur+Chennai';
export const REVIEWS_URL = 'https://www.justdial.com/Chennai/Dr-Thaj-Homoeo-Clinic-Near-Railway-Station-Minjur-Minjur/044PXX44-XX44-260301133151-H7N5_BZDET';

/* Clinic time zone — the open/closed status is always worked out in this zone */
export const TIMEZONE = 'Asia/Kolkata';

/* Opening schedule used by the live status. days: 0 = Sunday … 6 = Saturday.
   slots = one entry per session (split shifts are fine). Leave slots empty ([]) to hide that status. */
export const SCHEDULE = {
  consultation: { label: 'Consultation', days: [1, 2, 3, 4, 5, 6], slots: [{ open: '10:00', close: '13:00' }, { open: '18:00', close: '22:00' }] },
  pharmacy:     { label: 'Pharmacy',     days: [1, 2, 3, 4, 5, 6], slots: [{ open: '09:00', close: '13:30' }, { open: '17:00', close: '22:00' }] },
};

export const EMAIL = '';   // e.g. 'clinic@example.com' — hidden while empty

/* Social links: only entries with a url are shown. icon: instagram | facebook | youtube | linkedin | x | whatsapp */
export const SOCIALS = [
  { name: 'Instagram', icon: 'instagram', url: 'https://www.instagram.com/thajusmart/' },
  { name: 'Facebook',  icon: 'facebook',  url: 'https://www.facebook.com/share/1Eg7HTHXF1/' },
  { name: 'WhatsApp',  icon: 'whatsapp',  url: `https://wa.me/${WA_NUMBER}` },
];

/* Map + Google reviews */
export const MAP_QUERY = 'Dr. Thaj Homoeo Clinic, Minjur, Chennai';
export const MAP_EMBED_URL = '';       // optional: Google Maps → Share → Embed a map → paste the src="…" link (more reliable than MAP_QUERY)
export const GOOGLE_REVIEW_URL = '';   // the clinic's "Write a review" link from its Google Business profile; button hidden while empty

/* Pharmacy section. A row with an empty time is hidden. key links the row to SCHEDULE for the live status. */
export const PHARMACY = {
  deliveryNote: 'Doorstep delivery for your medicines.',   // add the delivery area here if it is limited
  hours: [
    { key: 'consultation', label: 'Consultation', days: 'Monday – Saturday', time: '10:00 AM – 1:00 PM, 6:00 PM – 10:00 PM' },
    { key: 'pharmacy',     label: 'Pharmacy',     days: 'Monday – Saturday', time: '9:00 AM – 1:30 PM, 5:00 PM – 10:00 PM' },
  ],
};

/* Patient results (before/after) — photos in /public/assets/results, shared with each patient's consent.
   Use before + after for the slider, or a single img for a ready-made collage.
   id: unique key. days (optional number): shows "Improvement seen in N days"; leave it out to hide the badge.
   duration / note are optional too; empty ones are not shown. */
export const RESULTS = [
  { id: 'shingles',    condition: 'Herpes zoster',            img: '/assets/results/herpes_zoster.webp' },
  { id: 'vesicular',   condition: 'Vesicular eruption',       img: '/assets/results/vesicular_eruption.webp' },
  { id: 'eczema',      condition: 'Eczema',                   img: '/assets/results/eczema.webp' },
  { id: 'pityriasis',  condition: 'Pityriasis alba',          img: '/assets/results/pityriasis_alba.webp' },
  { id: 'vitiligo',    condition: 'Vitiligo',                 img: '/assets/results/vitiligo.webp' },
  { id: 'puffy-eyes',  condition: 'Puffy eyes',               img: '/assets/results/puffy_eyes.webp' },
  { id: 'jaundice',    condition: 'Jaundice',                 img: '/assets/results/jaundice.webp' },
  { id: 'Bullous-skin-disorder', condition: 'tonsils' , img: '/assets/results/Bullous_skin_disorder.webp'},
  { id: 'rheumatoid',  condition: 'Rheumatoid arthritis',     img: '/assets/results/rheumatoid_arthritis.webp' },
  { id: 'ovarian-cyst',condition: 'Hemorrhagic ovarian cyst', img: '/assets/results/hemorrhagic_right_ovarian_cyst.webp' },
  { id: 'ureteric',    condition: 'Ureteric calculus',        img: '/assets/results/ureteric_calculus.webp' },
  { id: 'kidney-stone', condition: 'Kidney Stone' , img: '/assets/results/kidney_stone.webp'},
  { id: 'kidney-stone', condition: 'Kidney Stone' , img: '/assets/results/stones_3mm_5mm_scales.webp'},
  { id: 'kidney-stone', condition: 'Kidney Stone' , img: '/assets/results/stone_4_5mm_scale.webp'},
  { id: 'kidney-stone', condition: 'Kidney Stone' , img: '/assets/results/stone_7mm_scale.webp'},
  { id: 'tonsils', condition: 'tonsils' , img: '/assets/results/tonsils.webp'},
  { id: 'tonsils', condition: 'tonsils' , img: '/assets/results/diabetic_foot_ulcer.webp'}
];

/* Highlights & updates strip — images in /public/assets/gallery, shown in this order. Empty = section hidden. */
export const CLINIC_PHOTOS = [
  { src: '/assets/hero-images/clinicImg1.webp', alt: 'Describe image 1' },
  { src: '/assets/hero-images/clinicImg2.webp', alt: 'Describe image 2' },
  { src: '/assets/hero-images/clinicImg10.webp', alt: 'Describe image 3' },
  { src: '/assets/hero-images/clinicImg17.webp', alt: 'Describe image 11' },
  { src: '/assets/hero-images/clinicImg3.webp', alt: 'Describe image 5' },
  { src: '/assets/hero-images/clinicImg12.webp', alt: 'Describe image 6' },
  { src: '/assets/hero-images/clinicImg13.webp', alt: 'Describe image 7' },
  { src: '/assets/hero-images/clinicImg14.webp', alt: 'Describe image 8' },
  { src: '/assets/hero-images/clinicImg15.webp', alt: 'Describe image 9' },
  { src: '/assets/hero-images/clinicImg16.webp', alt: 'Describe image 10' },
  
  { src: '/assets/gallery/gallery5.webp', alt: 'Describe image 12' },
  { src: '/assets/gallery/gallery2.webp', alt: 'Describe image 13' },
  { src: '/assets/gallery/gallery1.webp', alt: 'Describe image 14' },
  { src: '/assets/gallery/gallery3.webp', alt: 'Describe image 15' },
];

/* FAQ — answers are written for this clinic. Edit freely; the structured data for Google is built from this list. */
export const FAQS = [
  { q: 'Where is Dr. Thaj Homoeo Clinic located?',
    a: `We are at ${ADDRESS}. The clinic is close to Minjur Railway Station; use "Get directions" in the contact section for the map.` },
  { q: 'Do I need an appointment before visiting?',
    a: 'An appointment is recommended so you are not kept waiting. Choose a service, date and time slot in the booking form, or call or message us on WhatsApp.' },
  { q: 'What are the consultation timings?',
    a: 'Consultations are Monday to Saturday, 10:00 AM to 1:00 PM and 6:00 PM to 10:00 PM, and the clinic is closed on Sundays. The last booking slots are 12:30 PM and 9:30 PM.' },
  { q: 'Which conditions do you treat?',
    a: 'We provide homoeopathic care for thyroid problems, asthma and respiratory complaints, digestive disorders, joint and muscle pain, migraine, women\u2019s and children\u2019s health, skin and hair concerns, and more. Counselling and nutrition counselling are also available.' },
  { q: 'Do you treat skin conditions?',
    a: 'Yes. We treat conditions such as eczema, psoriasis and drug allergy, as well as hair loss, with personalised homoeopathic care.' },
  { q: 'Do you offer wound dressing or diabetic foot care?',
    a: 'Yes. We provide wound dressing and first-aid treatment, and care for diabetic foot ulcers. Early attention and regular foot check-ups matter, so please see us as soon as you notice a wound that is slow to heal.' },
  { q: 'Are the medicines available at the clinic, and can they be delivered?',
    a: 'Yes. Our pharmacy stocks homoeopathic medicines, and we offer doorstep delivery.' },
  { q: 'Is a blood test facility available at the clinic?',
    a: 'Please check with us before your visit by phone or WhatsApp, and we will tell you whether the test you need can be arranged.' },
  { q: 'How can I contact the clinic?',
    a: `Call ${PHONES.map((p) => p.display).join(' or ')}, or message us on WhatsApp. You can also send an appointment request through the booking form on this page.` },
];

/* Patient feedback (Justdial, 5.0 from 35 ratings) */
export const PATIENT_TAGS = [
  'Highly attentive', 'Sterilised equipment', 'Easy booking', 'Good facilities',
  'Gentle care', 'Accurate diagnosis', 'Well priced', 'Well connected',
];
export const REVIEWS = [
  {
    name: 'Dr Navin Raj',
    text: 'My experience at Dr. Thaj Homoeo Clinic was exceptional. The staff was highly attentive, making me feel cared for. Plus, the pricing was reasonable and the booking process was incredibly easy.',
    tags: ['Highly attentive', 'Sterilised equipment', 'Easy booking'],
  },
  {
    name: 'Dr Harini Ayyadurai',
    text: 'I recently visited for a follow-up appointment in the Pediatrics and OB/GYN departments, and I couldn’t be more impressed. Booking was seamless, and the customer service was outstanding.',
    tags: ['Good facilities', 'Easy booking', 'Great customer service'],
  },
  {
    name: 'Siva Priya',
    text: 'most recommended.. used vitamin c soap huge result within one month.. never believe 🙏🏽',
    tags: ['Good facilities', 'Easy booking', 'Great customer service'],
  },
  {
    name: 'Swathi Palani',
    text: 'I wana share my personal experience,for the past 4 years I have been suffering from severe PCOD.After my delivery I was diagnosed with endometrial thickening of 18mm along with heavy bleeding.I consulted Dr.Thaj regarding my problem and by his advice I followed homeopathy medication and proper diet chart and now my pcod is getting reversed and I could literally feel changes in me.Thank you so much Doctor for your medications and advice.',
    tags: ['Good facilities', 'Easy booking', 'Great customer service'],
  },
  {
    name: 'Dinesh Krishna',
    text: 'Im DINESH , I have ear block and pain for 1week . I have never try homoeo medicines, but try this time 100% cured thanks forDR THAJ sir',
    tags: ['Good facilities', 'Easy booking', 'Great customer service'],
  },
  {
    name: 'Nandhini',
    text: "Hi, I’m Nandhini.I had been suffering from nasal blockage for more than 5 months. I tried many medications, but there was no improvement, and my condition reached a stage where surgery was suggested. After that, I consulted Dr. Thajudeen. He advised me to take the prescribed medicines properly and assured me that I would see good results within a week, without the need for surgery.As advised, I took the medicines regularly and seriously. It honestly felt like magic. Till now, I have not faced any problems — my nasal blockage and headaches are completely gone. Thank you so much, Doctor.",
    tags: ['Good facilities', 'Easy booking', 'Great customer service'],
  },
  {
    name: 'Preeti Suresh',
    text: "The overall treatment at this homeopathy clinic is very good.The treatment was effective.The doctor is kind, patient, and listens carefully. I'm satisfied with my treatment",
    tags: ['Good facilities', 'Easy booking', 'Great customer service'],
  },
  {
    name: 'Mehavarshini',
    text: "After months of suffering from severe throat pain and an uncontrollable cough that never responded to syrups or injections, Dr. Thaj’s treatment worked like a miracle. Within just a few days, my long-standing problem was finally under control, and I am truly grateful for his expertise and care.",
    tags: ['Good facilities', 'Easy booking', 'Great customer service'],
  },
  {
    name: 'Sumaiya',
    text: "Hi i am sumaiya , i had ear and nose block for one month - I tried several medicines , nothing has worked , then i asked DR . Thajudeen for medicines- to be frank i have never tried homeo till now , as he assured i took it for one week , within a week ,the block has vanished completely with no side effects. Honestly it has worked for me . I suggest , try it - for sure it will work .All credits to DR. THAJUDEEN 🥳",
    tags: ['Good facilities', 'Easy booking', 'Great customer service'],
  },
  {
    name: 'Mohammad Halith',
    text: "I have a problem in Hemorrhagic cyst .I underwent treatment for six months. He guided me what I should eat and what I shouldn't eat. Alhamdulillah cyst is now cure 😊 He is friendly approachable doctor to solve the problem",
    tags: ['Good facilities', 'Easy booking', 'Great customer service'],
  },
  {
    name: 'Nirmala',
    text: "My grandmother was suffering from a painful herpes infection with significant facial swelling and skin lesions. We consulted Dr. Thaj Homoeo clinic, and under Dr. Thaj’s care, we noticed significant improvement within 7 days. The swelling, lesions and discomfort reduced considerably, but still in treatment and we are very satisfied with his treatment and thankful for the care and guidance provided.",
    tags: ['Good facilities', 'Easy booking', 'Great customer service'],
  },
  {
    name: 'Zackariah',
    text: "My father developed a small spot under his eye, so we consulted Dr. Thajudeen. After examining him, the doctor prescribed some medication and advised us to follow the treatment for one month. Within just a few weeks, we could already see a significant improvement, and the spot has reduced considerably compared to the previous condition.I have attached both the previous photo and the recent photo to show the improvement. We are very happy with the results of the treatment.Thank you so much, Dr. Thajudeen, for your care, guidance, and effective treatment. We truly appreciate your support. ☺️❤️",
    tags: ['Good facilities', 'Easy booking', 'Great customer service'],
  },
  {
    name: 'S.Surya',
    text: "I was suffering from back pain, so I visited Dr. Thaj Homoeo Clinic for treatment. The doctor provided excellent care and prescribed homeopathic tablets. After taking the medication, my back pain completely disappeared, and I feel much better now. The treatment was effective, and the doctor was very kind and professional. I am truly satisfied with the service and would highly recommend Dr. Thaj Homoeo Clinic to anyone looking for quality homeopathic treatment. Thank you, Doctor!",
    tags: ['Good facilities', 'Easy booking', 'Great customer service'],
  },
  {
    name: 'Hajira Wahith',
    text: "I Highly recommend this doctor💯 ,my hubby had a kidney stone issue and after taking prescribed homeopathic medicine ,the stone was successfully passed through urine ...the treatment was very effective and natural I am very grateful to the Dr.thaj.",
    tags: ['Good facilities', 'Easy booking', 'Great customer service'],
  },
  {
    name: 'Hajira Wahith',
    text: "I Highly recommend this doctor💯 ,my hubby had a kidney stone issue and after taking prescribed homeopathic medicine ,the stone was successfully passed through urine ...the treatment was very effective and natural I am very grateful to the Dr.thaj.",
    tags: ['Good facilities', 'Easy booking', 'Great customer service'],
  },
  {
    name: 'Bhakya',
    text: "The homeopathic medicine is working very well for me, and I’m receiving really good treatment. They told me that I don’t necessarily have to continue taking the medicine continuously. The more we take care of our body and follow the right diet, the faster the body can recover.If we continue the medicine they prescribed, it will help us get better faster.He take really good care for patient.",
    tags: ['Good facilities', 'Easy booking', 'Great customer service'],
  },
  {
    name: "Dr Navin Sakthi's Homeo",
    text: "I highly recommend Dr. Thaj Homoeo Clinic in Minjur. Dr. Mohammed Thajudeen is an exceptional and highly experienced homeopathic doctor who listens to patients with great patience and understanding.The clinic provides highly effective, safe, and affordable treatments without any side effects. I noticed an excellent recovery from chronic health issues within a few weeks of starting the treatment. The clinic premises are clean, well-maintained, and follow excellent hygienic standards. If you are looking for permanent, non-surgical solutions for long-standing illnesses, this is definitely the best clinic in Minjur!",
    tags: ['Good facilities', 'Easy booking', 'Great customer service'],
  },
];

/* About section (sticky story): photos are placeholders from GALLERY — swap `img` for real clinic photos */
export const ABOUT_STORY = [
  {
    title: 'Treat the person as whole',
    text: 'Personalised homoeopathic care for thyroid, respiratory, digestive, joint, women’s and children’s health.',
    caption: 'Whole-person care',
    img: GALLERY[0],
  },
  {
    title: 'Qualified & registered',
    text: 'B.H.M.S and M.Sc Psychology, registered with the government under Reg. No. 7879A.',
    caption: 'Qualified & registered',
    img: GALLERY[1],
  },
  {
    title: 'Medicine and counselling together',
    text: 'Dr. Thajudeen’s psychology training sits alongside his homoeopathic practice, with counselling for adults, couples and children.',
    caption: 'Counselling & wellbeing',
    img: GALLERY[2],
  },
  {
    title: 'Easy to book',
    text: 'Choose a service, a date and a slot. Our team confirms your appointment shortly after.',
    caption: 'Simple booking',
    img: GALLERY[3],
  },
];