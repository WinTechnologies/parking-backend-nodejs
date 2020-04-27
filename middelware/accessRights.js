const jwt = require("jsonwebtoken");
const config = require("../config/database");
const accessRightsModel = require("../models/accessRights");
const rolesConfig = require("../config/main").roles;


const All_RIGHTS = [
  "view_users",
  "view_zones",
  "view_teams",
  "view_projects",
  "view_sites",
  "view_access_rights",
  "view_hardware",
  "view_product",
  "view_dashboards",
  "view_lowLevelAlert",
  "view_highLevelAlert",
  "view_monitoring",
  "view_shift",
  "view_payment",
  "edit_users",
  "edit_zones",
  "edit_teams",
  "edit_projects",
  "edit_sites",
  "edit_access_rights",
  "edit_hardware",
  "edit_product",
  "edit_dashboards",
  "edit_lowLevelAlert",
  "edit_highLevelAlert",
  "edit_monitoring",
  "edit_shift",
  "edit_payment",

  // administration
  "view_jobs",
  "edit_jobs", 
  "view_contraventions",
  "edit_contraventions",


  // assets
  "view_barrier",
  "edit_barrier",
  "view_fixedAnpr",
  "edit_fixedAnpr",
  "view_pAndD",
  "edit_pAndD",
  "view_rfidAntenna",
  "edit_rfidAntenna",
  "view_ticketDispenser",
  "edit_ticketDispenser",
  "view_ticketVerifier",
  "edit_ticketVerifier",
  "view_towVehicle",
  "edit_towVehicle",
  "view_tvm",
  "edit_tvm",
  "view_assetsTemplates",
  "edit_assetsTemplates",

  "view_membership",
  "edit_membership",
  "view_vehicle",
  "edit_vehicle",
  "view_client",
  "edit_client"
];

exports.sites = (userId, sites) => {
  sites = sites || [];
  let filteredSites = [];
  return new Promise((resolve, reject) => {
    accessRightsModel
      .getSitesByUserId(userId)
      .then(results => {
        let authorizedSites = [];
        if (results && results.rows) {
          results.rows.forEach(site => {
            if (
              site &&
              site.site_id &&
              site.rights &&
              site.rights.trim() !== ""
            ) {
              authorizedSites.push(site.site_id.toString());
            }
          });
        }
        sites.forEach(site => {
          if (authorizedSites.indexOf(site.id.toString()) > -1) {
            filteredSites.push(site);
          }
        });
        return resolve(filteredSites);
      })
      .catch(err => {
        return reject(err);
      });
  });
};

exports.projects = (userId, projects) => {
  projects = projects || [];
  let filteredProjects = [];
  // console.log("userId: ", userId)
  return new Promise((resolve, reject) => {
    accessRightsModel
      .getProjectsByUserId(userId)
      .then(results => {
        let authorizedProjects = [];
        if (results && results.rows) {
          results.rows.forEach(right => {
            if (
              right &&
              right.project_id &&
              right.rights &&
              right.rights.trim() !== "" &&
              authorizedProjects.indexOf(right.project_id.toString()) === -1
            ) {
              authorizedProjects.push(right.project_id.toString());
            }
          });
        }
        projects.forEach(project => {
          if (authorizedProjects.indexOf(project.id.toString()) > -1) {
            filteredProjects.push(project);
          }
        });
        return resolve(filteredProjects);
      })
      .catch(err => {
        return reject(err);
      });
  });
};

exports.filterAssets = (userId, assets, siteKey) => {
  siteKey = siteKey || "site_id";
  assets = assets || [];
  let filteredAssets = [];
  return new Promise((resolve, reject) => {
    accessRightsModel
      .getSitesByUserId(userId)
      .then(results => {
        let authorizedSites = [];
        if (results && results.rows) {
          results.rows.forEach(site => {
            if (
              site &&
              site.site_id &&
              site.rights &&
              site.rights.trim() !== ""
            ) {
              authorizedSites.push(site.site_id.toString());
            }
          });
        }
        assets.forEach(asset => {
          if (
            asset.hasOwnProperty(siteKey) &&
            asset[siteKey] &&
            authorizedSites.indexOf(asset[siteKey].toString()) > -1
          ) {
            filteredAssets.push(asset);
          }
        });
        return resolve(filteredAssets);
      })
      .catch(err => {
        return reject(err);
      });
  });
};

exports.getUserTypes = user => {
  user = user || {};
  let usertypes = rolesConfig.other.usertypes;
  for (let roleKey in rolesConfig) {
    if (
      rolesConfig.hasOwnProperty(roleKey) &&
      rolesConfig[roleKey].name === user.usertype
    ) {
      usertypes = rolesConfig[roleKey].usertypes;
    }
  }
  return usertypes;
};

exports.superAdminRights = () => {
  return rolesConfig.superadmin.rights;
};
