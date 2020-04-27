const MqttSubject = Object.freeze({
    CanceledCN: 'CanceledContravention',
    CreatedCN: 'CreatedContravention',
    UpdatedCN: 'UpdatedContravention',
    RemovedJob: 'RemovedJob',
    CreatedJob: 'CreatedJob',
    UpdatedJob: 'UpdatedJob',
    StartedJob: 'StartedJob',
    RemovedDefaultValue: 'RemovedDefaultValue',
    CreatedDefaultValue: 'CreatedDefaultValue',
    UpdatedDefaultValue: 'UpdatedDefaultValue'
});

const CNStatus = Object.freeze({
    Obs: '0', // Observation
    CN: '1', // Normal CN
    EvolvedCN: '3', // Observation -evolved-> Normal CN
    CancelObs: '2', // Cancelled Observation
    CancelCN: '4', // Cancelled CN
    DupCN: '5', // Duplicated
});

const CNNote = Object.freeze({
    EvolvedCN: 'Evolved into Contravention from Observation',
    DuplicatedCN: (cn_offline_number) => `Duplicate with CN: ${cn_offline_number}`,
    ExpiredObs: '24h Outstanding Obs',
});

const JobStatus = Object.freeze({
    types: {
        'CLAMP TO TOW': {
            open: 'TOW REQUESTED',
            cancel: 'CANCELED',
            start: 'TOW IN ROUTE',
            missed: 'MISSED',
            active: 'ACTIVE',
            complete: 'TOWED',
            paid: 'RELEASED',
        },
        'TOW JOB': {
            open: 'TOW REQUESTED',
            cancel: 'CANCELED',
            start: 'TOW IN ROUTE',
            missed: 'MISSED',
            delivery: 'IN ROUTE TO CARPOUND',
            complete: 'TOWED',
            paid: 'RELEASED',
        },
        'CLAMP JOB': {
            open: 'CLAMP REQUESTED',
            cancel: 'CANCELED',
            start: 'CLAMP IN ROUTE',
            missed: 'MISSED',
            active: 'ACTIVE',
            complete: 'CLAMPED',
            paid: 'DECLAMP REQUESTED',
        },
        'DECLAMP JOB': {
            open: 'DECLAMP REQUESTED',
            cancel: 'CANCELED',
            start: 'DECLAMP IN ROUTE',
            missed: 'MISSED',
            // doesn't have active,
            active: 'ACTIVE',
            complete: 'RELEASED',
            paid: 'RELEASED',
        },
    }
});

const SystemUser = Object.freeze('0000000000');
const CanceledCode = Object.freeze({
    TOW: '0000000015',
    CLAMP: '0000000014',
});
const CanceledReason = Object.freeze({
    JOB: '24h Outstanding job',
});


const ActiveJobStatus = [
    'TOW IN ROUTE',
    'IN ROUTE TO CARPOUND',
    'DECLAMP IN ROUTE',
    'CLAMP IN ROUTE',
    'ACTIVE'
];


const ViolationDecision = Object.freeze({
    Tow: 'Direct TOW',
    Clamp: 'Direct Clamp',
    Ticket: 'Direct Ticket',
    Obs: 'Observation',
});

const CNStatusReview = Object.freeze({
    UnReviewed: 'Unreviewed',
    ChallengeRequested: 'Challenge requested',
    Validated: 'Validated',
    Modified: 'Modified',
});

const CNStatusChallenge = Object.freeze({
    Rasied: 'Challenge requested',
    Cancelled: 'Contravention cancelled',
    Rejected: 'Challenge rejected'
});

const CNReviewDecision = Object.freeze({
    Raised: 'Challenge requested',
    Validated: 'Validated',
    Modified: 'Modified',
});

const CNChallengeDecision = Object.freeze({
    Pending: 'Pending',
    Cancelled: 'Contravention cancelled',
    Rejected: 'Rejected',
});

exports.MqttSubject = MqttSubject;
exports.CNStatus = CNStatus;
exports.CNNote = CNNote;
exports.JobStatus = JobStatus;
exports.ActiveJobStatus = ActiveJobStatus;
exports.CanceledCode = CanceledCode;
exports.CanceledReason = CanceledReason;
exports.SystemUser = SystemUser;
exports.ViolationDecision = ViolationDecision;
exports.CNStatusReview = CNStatusReview;
exports.CNStatusChallenge = CNStatusChallenge;
exports.CNReviewDecision = CNReviewDecision;
exports.CNChallengeDecision = CNChallengeDecision;