import React from 'react';
import PolicyLayout from '../components/common/PolicyLayout';
import { LuCreditCard } from 'react-icons/lu';
import { useTranslation } from 'react-i18next';

const BillingPolicy = () => {
    const { t } = useTranslation();
    return <PolicyLayout title={t('footer.billing')} slug="billing" icon={LuCreditCard} />;
};

export default BillingPolicy;
