module.exports = {
    /**
     * Build Permission Template List for an employee
     *  from permission_template, permission_features, permission_type tables
     *
     * @param template - permission_template table
     *    {{id, template_name, template_desc, date_created, admin_users_rights, admin_rights_template, ...}}
     * @param features - permission_feature table
     *    {[{id, section, feature, feature_name, feature_desc, permission_type, is_active}, ...]}
     * @param types - permission_type table
     *    {[permission_type_1, ..., permission_type_9]}
     * @returns
     *   {{
        id: template.id,
        template_name: template.template_name,
        template_desc: template.template_desc,
        date_created: template.date_created,

        admin_users_rights: permission_type - { id, permission_type, is_off, is_view, is_create, is_update, is_delete, permission_desc }
        admin_rights_template: permission_type - {...}
        global_analytics: permission_type - {...}
        ...
      }}
     */
    parsePermissionTemplate: (template, features, types) => {
        const resultTemplate = {
            id: template.id,
            template_name: template.template_name,
            template_desc: template.template_desc,
            date_created: template.date_created
        };
        features.forEach(feature => {
            resultTemplate[feature.feature] = types.find(type => type.permission_type === template[feature.feature]);
        });
        return resultTemplate;
    },

    /**
     * @param details_services
     *  JSON string in cashier_ticket_2.details_service
     * @returns {{services: {amount: number, service: Array<{id, name, amount}>}}}
     *  Parsed Services Object
     */
    parseServiceDetails(details_services) {
        let services;
        try {
            if (!details_services) throw new Error('Invalid value!');
            services = JSON.parse(details_services);
        } catch (err) {
            services = {
                service: [],
                amount: 0,
            };
        }
        return services;
    },

    /**
     * @param details_promo
     *  JSON string in cashier_ticket_2.detail_promo
     * @returns {{promos: {amount: number, promos: Array}}}
     *  Parsed Services Object
     */
    parsePromoDetails(details_promo) {
        let promos;
        try {
            promos = JSON.parse(details_promo);
        } catch (err) {
            promos = { promos: {
                    promos: [],
                    amount: 0,
                }};
        }
        return promos;
    },
};

