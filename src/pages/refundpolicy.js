import React from 'react';
import PolicyLayout from '../components/common/PolicyLayout';
import { LuRotateCcw } from 'react-icons/lu';
import { useTranslation } from 'react-i18next';

const RefundPolicy = () => {
    const { t } = useTranslation();
    return <PolicyLayout title={t('footer.refund')} slug="refund" icon={LuRotateCcw} />;
};

export default RefundPolicy;
