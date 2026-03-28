import { MOCK_CONTRACTS } from './mockDashboard';

const STORAGE_KEY = 'smartrent_contracts';

export const getContracts = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [...MOCK_CONTRACTS];
  } catch {
    return [...MOCK_CONTRACTS];
  }
};

export const saveContracts = (arr) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
};

export const getContractById = (id) => getContracts().find(c => c.id === id) || null;

export const createContract = (data) => {
  const contracts = getContracts();
  const newId = 'HD' + String(contracts.length + 1).padStart(4, '0');
  const newContract = {
    ...data,
    id: newId,
    createdAt: new Date().toLocaleDateString('vi-VN'),
    status: 'pending_renter_sign',
    renterSig: null,
  };
  saveContracts([...contracts, newContract]);
  return newContract;
};

export const signContract = (id, role, sigName) => {
  const contracts = getContracts();
  const idx = contracts.findIndex(c => c.id === id);
  if (idx === -1) return null;

  const now = new Date().toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  const sigEntry = { name: sigName, time: now };
  const contract = { ...contracts[idx] };

  if (role === 'showroom' || role === 'admin') {
    contract.showroomSig = sigEntry;
    contract.status = 'pending_renter_sign';
  } else if (role === 'renter' || role === 'owner') {
    contract.renterSig = sigEntry;
    contract.status = 'active';
  }

  contracts[idx] = contract;
  saveContracts(contracts);
  return contract;
};

export const resetContracts = () => {
  localStorage.removeItem(STORAGE_KEY);
};
