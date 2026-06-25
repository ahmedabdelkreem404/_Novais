import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { serverURL } from '../constants';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import { LuPlus, LuTrash2, LuSave, LuExternalLink } from 'react-icons/lu';
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaInstagram, FaGlobe, FaWhatsapp, FaGithub } from 'react-icons/fa';

const SocialLinks = () => {
    const { t } = useTranslation();
    const [links, setLinks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [savingId, setSavingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [deleteModalId, setDeleteModalId] = useState(null); // ID for the modal

    const getIcon = (platform) => {
        const p = platform ? platform.toLowerCase() : '';
        if (p.includes('facebook')) return <FaFacebookF />;
        if (p.includes('twitter') || p.includes('x')) return <FaTwitter />;
        if (p.includes('linkedin')) return <FaLinkedinIn />;
        if (p.includes('instagram')) return <FaInstagram />;
        if (p.includes('whatsapp')) return <FaWhatsapp />;
        if (p.includes('github') || p.includes('git')) return <FaGithub />;
        return <FaGlobe />;
    };

    const fetchLinks = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${serverURL}/admin/social-links`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLinks(response.data);
        } catch (error) {
            console.error("Failed to fetch social links", error);
            toast.error(t('common.error'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLinks();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleAddLink = () => {
        const newId = 'new-' + Date.now();
        setLinks(prev => [...prev, { id: newId, platform: '', url: '', is_active: true, isNew: true }]);
    };

    const handleRemoveLink = (id, isNew) => {
        if (isNew) {
            setLinks(prev => prev.filter(l => l.id !== id));
            return;
        }
        setDeleteModalId(id);
    };

    const confirmDelete = async () => {
        if (!deleteModalId) return;

        setDeletingId(deleteModalId);
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${serverURL}/admin/social-links/${deleteModalId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLinks(prev => prev.filter(l => String(l.id) !== String(deleteModalId)));
            toast.success(t('common.success'));
            setDeleteModalId(null);
        } catch (error) {
            toast.error(t('common.error'));
        } finally {
            setDeletingId(null);
        }
    };

    const handleSave = async (link) => {
        setSavingId(link.id);
        try {
            const token = localStorage.getItem('token');
            const data = {
                platform: link.platform,
                url: link.url,
                is_active: link.is_active
            };

            let response;
            if (link.isNew) {
                response = await axios.post(`${serverURL}/admin/social-links`, data, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setLinks(prev => prev.map(l => l.id === link.id ? { ...response.data, isNew: false } : l));
            } else {
                response = await axios.put(`${serverURL}/admin/social-links/${link.id}`, data, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setLinks(prev => prev.map(l => l.id === link.id ? response.data : l));
            }
            toast.success(t('common.success'));
        } catch (error) {
            toast.error(t('common.error'));
        } finally {
            setSavingId(null);
        }
    };

    const updateLinkState = (id, field, value) => {
        setLinks(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold">{t('admin.dashboard.social_links.title') || 'Social Media Links'}</h1>
                    <p className="text-gray-500">{t('admin.dashboard.social_links.subtitle') || 'Manage icons and links in the public footer'}</p>
                </div>
                <Button variant="primary" icon={LuPlus} onClick={handleAddLink}>
                    {t('admin.dashboard.social_links.add') || 'Add New Link'}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {links.map((link) => (
                    <Card key={link.id} className="p-6 relative">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 text-xl shadow-inner">
                                {getIcon(link.platform)}
                            </div>
                            <div className="flex-grow">
                                <input
                                    value={link.platform}
                                    onChange={(e) => updateLinkState(link.id, 'platform', e.target.value)}
                                    placeholder={t('admin.dashboard.social_links.platform') || 'Platform (e.g. Facebook)'}
                                    className="w-full border-none bg-transparent font-bold p-0 focus:ring-0 text-lg outline-none placeholder:text-gray-400"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Input
                                label={t('admin.dashboard.social_links.url') || 'URL'}
                                value={link.url}
                                onChange={(e) => updateLinkState(link.id, 'url', e.target.value)}
                                placeholder="https://..."
                            />

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id={`active-${link.id}`}
                                    checked={link.is_active}
                                    onChange={(e) => updateLinkState(link.id, 'is_active', e.target.checked)}
                                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                                <label htmlFor={`active-${link.id}`} className="text-sm font-medium cursor-pointer">
                                    {t('admin.dashboard.social_links.is_active') || 'Active'}
                                </label>
                            </div>

                            <div className="flex gap-2 pt-4">
                                <Button
                                    className="flex-grow"
                                    variant="primary"
                                    icon={LuSave}
                                    onClick={() => handleSave(link)}
                                    disabled={!link.platform || !link.url || savingId === link.id}
                                    isLoading={savingId === link.id}
                                >
                                    {t('common.save')}
                                </Button>
                                <button
                                    className="btn btn-danger btn-md relative overflow-hidden"
                                    onClick={() => handleRemoveLink(link.id, link.isNew)}
                                    disabled={deletingId === link.id}
                                >
                                    <LuTrash2 size={18} />
                                </button>
                                {link.url && !link.isNew && (
                                    <a href={link.url} target="_blank" rel="noopener noreferrer">
                                        <Button variant="secondary" icon={LuExternalLink} />
                                    </a>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}

                {links.length === 0 && !isLoading && (
                    <div className="col-span-full py-20 text-center bg-gray-50 dark:bg-white/5 rounded-3xl border-2 border-dashed border-gray-200 dark:border-white/10">
                        <p className="text-gray-500">{t('admin.dashboard.social_links.no_links')}</p>
                    </div>
                )}
            </div>

            {/* Custom Delete Modal */}
            {deleteModalId && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#0a0a0b] rounded-2xl shadow-2xl p-6 w-full max-w-md border border-gray-100 dark:border-white/5">
                        <div className="text-right"> {/* Ensure RTL alignment if generic, but controlled by parent dir */}
                            <h3 className="text-xl font-bold text-red-600 mb-2">{t('common.delete')}</h3>
                            <p className="text-sm text-gray-500 mb-6">{t('common.confirm_delete')}</p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={confirmDelete}
                                className="flex-1 py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                                disabled={deletingId === deleteModalId}
                            >
                                {deletingId === deleteModalId ? (
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <span>{t('common.delete')}</span>
                                )}
                            </button>
                            <button
                                onClick={() => setDeleteModalId(null)}
                                className="flex-1 py-3 bg-gray-100 dark:bg-white/5 text-gray-500 rounded-xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                            >
                                {t('common.cancel')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SocialLinks;
