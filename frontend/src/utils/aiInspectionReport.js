export const AI_SEVERITY_LABELS = {
  none: 'Khong dang ke',
  minor: 'Nhe',
  moderate: 'Trung binh',
  severe: 'Nang',
};

export const getAiInspectionResult = (report) => report?.result || null;

export const hasAiInspectionReport = (workflow) => Boolean(getAiInspectionResult(workflow?.aiInspection));

export const getAiInspectionDifferences = (report) => {
  const differences = getAiInspectionResult(report)?.differences;
  return Array.isArray(differences) ? differences : [];
};

export const getAiInspectionSummaryMeta = (report) => {
  const result = getAiInspectionResult(report);
  const severity = String(result?.severity || '').toLowerCase();

  if (!result) {
    return {
      badgeLabel: 'Chua co bao cao',
      eyebrow: 'Bao cao AI',
      title: 'Chua co du lieu phan tich',
      description: 'He thong se luu ket qua AI ngay sau khi bo anh doi chieu duoc phan tich thanh cong.',
      bg: '#f8fafc',
      border: '#e2e8f0',
      color: '#334155',
      status: 'empty',
    };
  }

  if (!result.damage_detected) {
    return {
      badgeLabel: 'Khong co hu hong moi',
      eyebrow: 'AI xac nhan',
      title: 'Khong ghi nhan hu hong moi ro ret',
      description: result.summary || 'AI khong phat hien khac biet dang lo ngai giua anh nhan xe va anh tra xe.',
      bg: '#ecfdf5',
      border: '#86efac',
      color: '#166534',
      status: 'clean',
    };
  }

  if (severity === 'severe') {
    return {
      badgeLabel: 'Can xu ly gap',
      eyebrow: 'AI canh bao',
      title: 'Co dau hieu hu hong nghiem trong',
      description: result.summary || 'AI ghi nhan thay doi lon giua 2 bo anh. Showroom nen doi chieu truc tiep.',
      bg: '#fef2f2',
      border: '#fca5a5',
      color: '#b91c1c',
      status: 'severe',
    };
  }

  if (severity === 'moderate') {
    return {
      badgeLabel: 'Can doi chieu',
      eyebrow: 'AI canh bao',
      title: 'Co kha nang phat sinh hu hong moi',
      description: result.summary || 'AI phat hien mot vai diem thay doi can showroom kiem tra lai khi nhan xe.',
      bg: '#fffbeb',
      border: '#fcd34d',
      color: '#b45309',
      status: 'moderate',
    };
  }

  return {
    badgeLabel: 'Can kiem tra',
    eyebrow: 'AI phat hien',
    title: 'Co thay doi nho can luu y',
    description: result.summary || 'AI thay mot so khac biet nho giua anh truoc va sau thue.',
    bg: '#fff7ed',
    border: '#fdba74',
    color: '#9a3412',
    status: 'minor',
  };
};

export const getAiInspectionSeverityLabel = (report) => {
  const severity = String(getAiInspectionResult(report)?.severity || '').toLowerCase();
  return AI_SEVERITY_LABELS[severity] || severity || 'N/A';
};
