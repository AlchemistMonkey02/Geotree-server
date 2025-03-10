import React, { useEffect, useState } from 'react';
import { getAllRoutes } from '../apiService';

const RoutesList = () => {
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRoutes = async () => {
            try {
                const data = await getAllRoutes();
                setRoutes(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchRoutes();
    }, []);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <ul>
            {routes.map((route) => (
                <li key={route.id}>{route.name} - Usage: {route.usage}</li>
            ))}
        </ul>
    );
};

export default RoutesList; 