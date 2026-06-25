import React from 'react';
import PolicyLayout from '../components/common/PolicyLayout';
import { LuFileText } from 'react-icons/lu';
import { useTranslation } from 'react-i18next';

const TermsPolicy = () => {
    const { t } = useTranslation();
    return <PolicyLayout title={t('footer.terms')} slug="terms" icon={LuFileText} />;
};

export default TermsPolicy;
