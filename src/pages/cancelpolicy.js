import React from 'react';
import PolicyLayout from '../components/common/PolicyLayout';
import { LuCircleX } from 'react-icons/lu';
import { useTranslation } from 'react-i18next';

const CancelPolicy = () => {
    const { t } = useTranslation();
    return <PolicyLayout title={t('footer.cancellation')} slug="cancellation" icon={LuCircleX} />;
};

export default CancelPolicy;
