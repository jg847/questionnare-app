import { Suspense } from 'react';

import { PublicSiteHeader } from '@/components/public/public-site-header';
import { QuestionnaireExperience } from '@/components/questionnaire/questionnaire-experience';

export default function QuizPage() {
  return (
    <>
      <PublicSiteHeader />
      <Suspense fallback={null}>
        <QuestionnaireExperience />
      </Suspense>
    </>
  );
}