import React, { useState } from 'react';
import axios from 'axios';
import { serverURL } from '../constants';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import { LuSend, LuMail, LuPhone, LuMapPin } from 'react-icons/lu';
import { useTranslation } from 'react-i18next';

const Contact = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [processing, setProcessing] = useState(false);
    const [fname, setFname] = useState('');
    const [lname, setLname] = useState('');
    const [msg, setMsg] = useState('');

    const showToast = (message) => {
        toast(message, {
            position: "bottom-center",
            theme: "dark"
        });
    };

    const contactSubmit = async (e) => {
        e.preventDefault();
        if (!email || !phone || !fname || !lname || !msg) {
            showToast(t('auth.fill_fields'));
            return;
        }

        const postURL = serverURL + '/contact';
        setProcessing(true);
        try {
            const response = await axios.post(postURL, { fname, lname, email, phone, msg });
            if (response.data.success) {
                showToast(response.data.message);
                setFname('');
                setLname('');
                setEmail('');
                setPhone('');
                setMsg('');
            } else {
                showToast(response.data.message);
            }
        } catch (error) {
            showToast(t('common.error'));
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className={`w-full py-8 px-6 md:px-12 ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="max-w-7xl mx-auto">
                <motion.div
                    className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}>

                    <div>
                        <h1 className="text-4xl md:text-6xl font-black mb-6">{t('contact_page.title')}</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-lg mb-12 max-w-lg leading-relaxed">
                            {t('contact_page.subtitle')}
                        </p>

                        <div className="space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                                    <LuMail size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400 font-bold uppercase tracking-wider">{t('contact_page.form.email')}</p>
                                    <p className="text-lg font-bold">support@novais.com</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                                    <LuPhone size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400 font-bold uppercase tracking-wider">{t('contact_page.form.phone')}</p>
                                    <p className="text-lg font-bold">+1 (555) 123-4567</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                                    <LuMapPin size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400 font-bold uppercase tracking-wider">Location</p>
                                    <p className="text-lg font-bold">San Francisco, CA</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Card className="p-8 md:p-10 rounded-3xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-2xl">
                        <form onSubmit={contactSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input
                                    label={t('contact_page.form.fname')}
                                    placeholder={t('contact_page.form.placeholder_fname')}
                                    value={fname}
                                    onChange={(e) => setFname(e.target.value)}
                                    required
                                />
                                <Input
                                    label={t('contact_page.form.lname')}
                                    placeholder={t('contact_page.form.placeholder_lname')}
                                    value={lname}
                                    onChange={(e) => setLname(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input
                                    label={t('contact_page.form.email')}
                                    type="email"
                                    placeholder={t('contact_page.form.placeholder_email')}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                <Input
                                    label={t('contact_page.form.phone')}
                                    type="number"
                                    placeholder={t('contact_page.form.placeholder_phone')}
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                    {t('contact_page.form.message')}
                                </label>
                                <textarea
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4 min-h-[150px] focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 dark:text-white"
                                    placeholder={t('contact_page.form.placeholder_msg')}
                                    value={msg}
                                    onChange={(e) => setMsg(e.target.value)}
                                    required></textarea>
                            </div>

                            <Button
                                type="submit"
                                variant="primary"
                                size="xl"
                                className="w-full shadow-lg shadow-blue-500/25"
                                isLoading={processing}
                                icon={LuSend}>
                                {t('contact_page.form.submit')}
                            </Button>
                        </form>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
};

export default Contact;
