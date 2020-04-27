const OSES_SERVER_IP = process.env.OSES_SERVER_IP;
const OSES_SERVER_PORT = process.env.OSES_SERVER_PORT;
const OSES_AUTH_SERVER_IP = process.env.OSES_AUTH_SERVER_IP;
const OSES_AUTH_SERVER_PORT = process.env.OSES_AUTH_SERVER_PORT;

module.exports = {
	MAWGIF_API_BASE: `http://${OSES_SERVER_IP}:${parseInt(OSES_SERVER_PORT)}`,
	MAWGIF_API_BASE_TOKEN: `http://${OSES_AUTH_SERVER_IP}:${parseInt(OSES_AUTH_SERVER_PORT)}/WebOAuthAPI/token`,
    // API_BASE: 'http://217.182.89.217:8001/api',
    // SOCKET_PORT: 8001,
    smtp: {
        host: 'ssl0.ovh.net',
        port: 465,
        user: 'welcome@datategy.net',
        password: 'neuroP@SS',
        sender: 'welcome@datategy.net'
    },
    mawgif_smtp: {
        grant_type: 'password',
        client_id: process.env.MAWGIF_SMTP_CLIENT_ID,
        username: process.env.MAWGIF_SMTP_USERNAME,
        password: process.env.MAWGIF_SMTP_PASSWORD
    },
    MAWGIF_FTP: {
        host: '192.168.111.238',
        port: 21,
        user: 'mawgif',
        password: 'qGQ7baYdoDYURWowvMoC',
        connTimeout: 10000,
        keepalive: 10000,
        secure: false
    },
    roles: {
        superadmin: {
            name: 'Superadmin',
            rights: [
                "view_users", "view_zones", "view_teams", "view_projects", "view_sites", "view_vehicles",
                "view_access_rights", "view_hardware", "view_product", "view_dashboards", "view_lowLevelAlert", "view_highLevelAlert",
                "view_monitoring", "view_shift", "view_administration", "view_membership", "view_payment", "edit_users", "edit_zones",
                "edit_teams", "edit_projects", "edit_sites", "edit_vehicles", "edit_access_rights", "edit_hardware", "edit_product",
                "edit_dashboards", "edit_lowLevelAlert", "edit_highLevelAlert", "edit_monitoring", "edit_shift", "edit_administration",
                "edit_membership", "edit_payment",
                // assets
                'view_barrier', 'edit_barrier', 'view_fixedAnpr', 'edit_fixedAnpr', 'view_pAndD', 'edit_pAndD', 'view_rfidAntenna', 'edit_rfidAntenna',
                'view_ticketDispenser', 'edit_ticketDispenser', 'view_ticketVerifier', 'edit_ticketVerifier', 'view_towVehicle', 'edit_towVehicle',
                'view_tvm', 'edit_tvm', 'view_assetsTemplates', 'edit_assetsTemplates'
            ],
            usertypes: ['Superadmin', 'Admin', 'Manager', 'Supervisor', 'Cashier', 'Taxi', 'Driver', 'Enforcer', 'Clamper', 'Valet']
        },
        admin: {
            name: 'Admin',
            rights: [
                "view_users", "view_zones", "view_teams", "view_projects", "view_sites", "view_vehicles",
                "view_access_rights", "view_hardware", "view_product", "view_dashboards", "view_lowLevelAlert", "view_highLevelAlert",
                "view_monitoring", "view_shift", "view_administration", "view_membership", "view_payment", "edit_users", "edit_zones",
                "edit_teams", "edit_projects", "edit_sites", "edit_vehicles", "edit_access_rights", "edit_hardware", "edit_product",
                "edit_dashboards", "edit_lowLevelAlert", "edit_highLevelAlert", "edit_monitoring", "edit_shift", "edit_administration",
                "edit_membership", "edit_payment",
                // assets
                'view_barrier', 'edit_barrier', 'view_fixedAnpr', 'edit_fixedAnpr', 'view_pAndD', 'edit_pAndD', 'view_rfidAntenna', 'edit_rfidAntenna',
                'view_ticketDispenser', 'edit_ticketDispenser', 'view_ticketVerifier', 'edit_ticketVerifier', 'view_towVehicle', 'edit_towVehicle',
                'view_tvm', 'edit_tvm', 'view_assetsTemplates', 'edit_assetsTemplates'
            ],
            usertypes: ['Admin', 'Manager', 'Supervisor', 'Cashier', 'Taxi', 'Driver', 'Enforcer', 'Clamper', 'Valet']
        },
        manager: {
            name: 'Manager',
            rights: [
                "view_users", "view_zones", "view_teams", "view_projects", "view_sites", "view_vehicles",
                "view_access_rights", "view_hardware", "view_product", "view_dashboards", "view_lowLevelAlert", "view_highLevelAlert",
                "view_monitoring", "view_shift", "view_administration", "view_membership", "view_payment", "edit_users", "edit_zones",
                "edit_teams", "edit_projects", "edit_sites", "edit_vehicles", "edit_access_rights", "edit_hardware", "edit_product",
                "edit_dashboards", "edit_lowLevelAlert", "edit_highLevelAlert", "edit_monitoring", "edit_shift", "edit_administration",
                "edit_membership", "edit_payment"
            ],
            usertypes: ['Manager', 'Supervisor', 'Cashier', 'Taxi', 'Driver', 'Enforcer', 'Clamper', 'Valet']
        },
        other: {
            name: 'Other',
            rights: [
                "view_users", "view_zones", "view_teams", "view_projects", "view_sites", "view_vehicles", "edit_users",
                "edit_zones", "edit_teams", "edit_projects", "edit_sites", "edit_vehicles", "edit_dashboards"
            ],
            usertypes: ['Supervisor', 'Cashier', 'Taxi', 'Driver', 'Enforcer', 'Clamper', 'Valet']
        }
    }
};
