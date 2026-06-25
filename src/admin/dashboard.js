import React, { useEffect, useState } from 'react';
import DashboardCards from './components/dashboardcards';
import { serverURL } from '../constants';
import axios from 'axios';

const Dashboard = () => {
    const [data, setData] = useState({
        users: 0,
        users_trend: 0,
        paid: 0,
        free: 0,
        courses: 0,
        courses_trend: 0,
        videoType: 0,
        textType: 0,
        sum: 0,
        monthly_trend: 0,
        total: 0,
        total_trend: 0
    });

    useEffect(() => {
        async function dashboardData() {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const config = {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                };
                const postURL = serverURL + `/admin/stats`;
                const response = await axios.get(postURL, config);
                setData(response.data);
            } catch (error) {
                console.error("Admin Access Error", error);
            }
        }
        dashboardData();
    }, []);

    return (
        <div>
            <DashboardCards datas={data} />
        </div>
    );
};
export default Dashboard;
