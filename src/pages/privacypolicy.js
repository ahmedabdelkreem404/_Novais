import React from 'react';
import PolicyLayout from '../components/common/PolicyLayout';
import { LuShieldCheck } from 'react-icons/lu';
import { useTranslation } from 'react-i18next';

const PrivacyPolicy = () => {
    const { t } = useTranslation();
    return <PolicyLayout title={t('footer.privacy')} slug="privacy" icon={LuShieldCheck} />;
};

export default PrivacyPolicy;
