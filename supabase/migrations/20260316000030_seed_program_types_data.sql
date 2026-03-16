-- Seed program types with rich content extracted from public program pages.
-- Updates existing rows and inserts Special Needs if missing.
-- FAQs use generic answers shared across program types.

-- Insert Special Needs if not present
insert into public.program_types (name, sort_order, is_active, short_description, about_text, key_benefits, slug)
select 'Special Needs', 80, true,
  'Inclusive care for children with diverse needs',
  'Special needs programs provide inclusive, supportive care for children with developmental differences, disabilities, or special requirements. Our trained staff work closely with families and therapists to create individualized care plans that help every child reach their potential.',
  array[
    'Trained staff in special needs care',
    'Individualized education plans (IEPs) supported',
    'Therapy integration (speech, OT, PT)',
    'Inclusive classrooms when appropriate',
    'Strong family communication and partnership'
  ],
  'special-needs'
where not exists (select 1 from public.program_types where lower(name) = 'special needs');

-- Update Infant Care
update public.program_types set
  short_description = 'Nurturing care for babies 6 weeks to 12 months',
  about_text = 'Our infant care programs provide a safe, nurturing environment where your baby can thrive. Experienced caregivers focus on developmental milestones, sensory exploration, and building secure attachments. With low caregiver-to-infant ratios, your little one receives individualized attention and care throughout the day.',
  key_benefits = array[
    'Low caregiver-to-infant ratios (typically 1:3 or 1:4)',
    'Age-appropriate sensory activities and tummy time',
    'Daily communication with parents via app or log',
    'Flexible feeding and nap schedules',
    'Safe sleep practices following AAP guidelines'
  ],
  slug = 'infant-care'
where lower(name) = 'infant care';

-- Update Toddler Care
update public.program_types set
  short_description = 'Active learning for children ages 1-2 years',
  about_text = 'Toddler programs support your child''s growing independence and curiosity. Through play-based learning, toddlers develop language skills, motor coordination, and social abilities. Our safe, stimulating environments encourage exploration while building confidence and self-expression.',
  key_benefits = array[
    'Play-based curriculum focused on exploration',
    'Language development through songs and stories',
    'Gross and fine motor skill activities',
    'Introduction to potty training support',
    'Social skill development through group play'
  ],
  slug = 'toddler-care'
where lower(name) = 'toddler care';

-- Update Preschool
update public.program_types set
  short_description = 'Kindergarten readiness for ages 3-5',
  about_text = 'Preschool programs prepare children for academic success while nurturing their natural love of learning. Our comprehensive curriculum includes early literacy, math concepts, science exploration, and creative arts. Children develop the social-emotional skills needed to thrive in kindergarten and beyond.',
  key_benefits = array[
    'Structured curriculum with academic foundations',
    'Early literacy and phonics instruction',
    'Introduction to math concepts and problem-solving',
    'Science experiments and nature exploration',
    'Art, music, and dramatic play opportunities'
  ],
  slug = 'preschool'
where lower(name) = 'preschool';

-- Update Montessori
update public.program_types set
  short_description = 'Child-led learning in prepared environments',
  about_text = 'Montessori programs follow the proven educational philosophy developed by Dr. Maria Montessori. Children learn at their own pace in carefully prepared environments with specially designed materials. This approach develops independence, concentration, and a genuine love for learning.',
  key_benefits = array[
    'Mixed-age classrooms (typically 3-6 years)',
    'Self-directed learning with teacher guidance',
    'Hands-on Montessori materials and activities',
    'Focus on practical life skills',
    'Respect for each child''s individual development'
  ],
  slug = 'montessori'
where lower(name) = 'montessori';

-- Update Home Daycare
update public.program_types set
  short_description = 'Small-group care in a home setting',
  about_text = 'Home daycare programs offer intimate, family-style care in a provider''s home. With smaller group sizes, children receive individualized attention in a cozy, comfortable environment. Many parents appreciate the home-like atmosphere and the strong bonds formed with consistent caregivers.',
  key_benefits = array[
    'Small group sizes (typically 6-12 children)',
    'Home-like, comfortable environment',
    'Consistent caregiver relationships',
    'Often more flexible hours and schedules',
    'Typically more affordable than centers'
  ],
  slug = 'home-daycare'
where lower(name) = 'home daycare';

-- Update After School
update public.program_types set
  short_description = 'Care and enrichment for school-age children',
  about_text = 'After school programs provide safe, supervised care for children during after-school hours. Our programs balance homework help with enrichment activities, physical play, and social time. Children have the opportunity to explore new interests while building friendships.',
  key_benefits = array[
    'Homework help and tutoring support',
    'Enrichment activities (art, STEM, sports)',
    'Healthy snacks provided',
    'Transportation from local schools',
    'Flexible pickup times until 6-7 PM'
  ],
  slug = 'after-school'
where lower(name) = 'after school';

-- Update Special Needs (in case it was inserted above)
update public.program_types set
  short_description = 'Inclusive care for children with diverse needs',
  about_text = 'Special needs programs provide inclusive, supportive care for children with developmental differences, disabilities, or special requirements. Our trained staff work closely with families and therapists to create individualized care plans that help every child reach their potential.',
  key_benefits = array[
    'Trained staff in special needs care',
    'Individualized education plans (IEPs) supported',
    'Therapy integration (speech, OT, PT)',
    'Inclusive classrooms when appropriate',
    'Strong family communication and partnership'
  ],
  slug = 'special-needs'
where lower(name) = 'special needs';

-- Insert FAQs for each program type (generic answers from program detail page)
-- Delete existing FAQs first to avoid duplicates on re-run
delete from public.program_type_faqs;

insert into public.program_type_faqs (program_type_id, question, answer, sort_order)
select pt.id, faq.question, faq.answer, faq.sort_order
from public.program_types pt
cross join (
  values
    (0, 'What age is appropriate for this program?', 'Age requirements vary by program. Infant care typically accepts children from 6 weeks to 12 months, toddler programs serve ages 1-2, preschool is for ages 3-5, and school-age programs are for children 5 and older.'),
    (1, 'How do I know if this program is right for my child?', 'Consider your child''s temperament, developmental needs, and your family''s values. We recommend visiting multiple programs, observing classrooms, and speaking with current parents before making a decision.'),
    (2, 'What qualifications do teachers have?', 'Teacher qualifications vary by program type and state requirements. Most states require lead teachers to have at least a Child Development Associate (CDA) credential, while many have degrees in early childhood education.'),
    (3, 'How can I prepare my child for starting this program?', 'Gradual transitions work best. Visit the program together, establish consistent routines at home, read books about school, and maintain a positive attitude about the experience.')
) as faq(sort_order, question, answer)
where pt.slug in ('infant-care', 'toddler-care', 'preschool', 'montessori', 'home-daycare', 'after-school', 'special-needs');
