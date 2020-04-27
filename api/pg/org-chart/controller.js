const orgChartModel = require('./model');
const OrgChart_CONST = require('./const');

exports.get = async (req, res, next) => {
    try {
        const projectId = req.query.project_id;
        const employeesInHierarchy = await orgChartModel.getAllInHierarchy(projectId);
        let hierarchy = null;
        let disconnectedEmployees = [];
        if (employeesInHierarchy.rows.length > 0) {
            [hierarchy, disconnectedEmployees] = createHierarchy(employeesInHierarchy.rows);
        }
        const employeesNotInHierarchy = await orgChartModel.getAllNotInHierarchy(projectId);
        const data = {
            employees: [
                ...employeesNotInHierarchy.rows,
                ...disconnectedEmployees
            ],
            hierarchy
        };
        return res.status(200).json(data);
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
};

const createHierarchy = (employees) => {
    let ceo = {};
    let disconnectedEmployees = [];
    employees.forEach((curEmp) => {
        // return if current employee is CEO of this organization
        if (curEmp.supervisor_id === OrgChart_CONST.CEO) {
            ceo = curEmp;
            return;
        }

        // if check current employee's supervisor(parent node) and the supervisor node SHOULD BE CONNECTED from CEO node.
        const supervisor = employees.find(e => e.employee_id === curEmp.supervisor_id);
        const disconnected = supervisor && disconnectedEmployees.find((el) => el.employee_id === supervisor.employee_id);

        if (supervisor && !disconnected) {
            supervisor.children = supervisor.children ? supervisor.children : [];
            supervisor.children.push(curEmp);
        } else {
            disconnectedEmployees.push(curEmp);
        }
    });
    return [ceo, disconnectedEmployees];
};

exports.add = (req, res, next) => {
    orgChartModel.add(req.body).then(response => {
        return res.status(200).json({ message: 'success.' });
    })
        .catch(err => {
            return res.status(400).json({ message: err.message });
        });
};

exports.del = (req, res, next) => {
    if (req.body) {
        orgChartModel.del(req.body).then(result => {
            return res.status(202).json({ message: 'success.' })
        })
            .catch(err => {
                return res.status(400).json({ message: err.message });
            });
    }
};
