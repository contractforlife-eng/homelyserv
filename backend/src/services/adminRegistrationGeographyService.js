import User from '../models/User.js';

const ROLES = new Set(['ADMIN', 'EMPLOYER', 'WORKER', 'SUPPORT', 'SUPPORT_HELPER']);
const MAX_LIMIT = 100;
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parsePositiveInteger = (value, fallback, max) => {
  if (value === undefined || value === '') return fallback;
  if (!/^\d+$/.test(String(value))) throw new TypeError('Pagination values must be positive integers');
  const parsed = Number(value);
  if (parsed < 1 || parsed > max) throw new TypeError(`Pagination value must be between 1 and ${max}`);
  return parsed;
};

export const parseGeographyUserQuery = (query = {}) => {
  const page = parsePositiveInteger(query.page, 1, 1_000_000);
  const limit = parsePositiveInteger(query.limit, 20, MAX_LIMIT);
  const search = String(query.search || '').trim();
  if (search.length > 100) throw new TypeError('Search must be 100 characters or fewer');

  const country = String(query.country || '').trim().toUpperCase();
  if (country && country !== 'UNKNOWN' && !/^[A-Z]{2}$/.test(country)) {
    throw new TypeError('Country must be a two-letter code or UNKNOWN');
  }

  const role = String(query.role || '').trim().toUpperCase();
  if (role && !ROLES.has(role)) throw new TypeError('Invalid role');
  return { page, limit, search, country, role };
};

export const getRegistrationGeographySummary = async (UserModel = User) => {
  const [result = {}] = await UserModel.aggregate([
    {
      $facet: {
        totals: [{
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            knownCountryUsers: { $sum: { $cond: [{ $and: [{ $ne: ['$registrationCountryCode', null] }, { $ne: ['$registrationCountryCode', ''] }] }, 1, 0] } },
          },
        }],
        countries: [
          { $match: { registrationCountryCode: { $type: 'string', $ne: '' } } },
          { $group: { _id: { countryCode: '$registrationCountryCode', countryName: '$registrationCountryName' }, count: { $sum: 1 } } },
          { $sort: { count: -1, '_id.countryName': 1 } },
        ],
      },
    },
  ]);

  const totalUsers = result.totals?.[0]?.totalUsers || 0;
  const knownCountryUsers = result.totals?.[0]?.knownCountryUsers || 0;
  const countries = (result.countries || []).map((country) => ({
    countryCode: country._id.countryCode,
    countryName: country._id.countryName || 'Unknown',
    count: country.count,
    percentage: totalUsers ? Number(((country.count / totalUsers) * 100).toFixed(2)) : 0,
  }));

  return {
    totalUsers,
    knownCountryUsers,
    unknownCountryUsers: totalUsers - knownCountryUsers,
    countriesRepresented: countries.length,
    countries,
  };
};

export const getRegistrationGeographyUsers = async (query, UserModel = User) => {
  const { page, limit, search, country, role } = parseGeographyUserQuery(query);
  const clauses = [];
  if (search) {
    const matcher = new RegExp(escapeRegex(search), 'i');
    clauses.push({ $or: [{ fullName: matcher }, { email: matcher }] });
  }
  if (country === 'UNKNOWN') {
    clauses.push({ $or: [
      { registrationCountryCode: { $exists: false } },
      { registrationCountryCode: null },
      { registrationCountryCode: '' },
    ] });
  } else if (country) {
    clauses.push({ registrationCountryCode: country });
  }
  if (role) clauses.push({ role });
  const filter = clauses.length ? { $and: clauses } : {};

  const [total, users] = await Promise.all([
    UserModel.countDocuments(filter),
    UserModel.find(filter)
      .select('_id fullName email role createdAt +registrationCountryName +registrationCountryCode +registrationIp')
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  return {
    users: users.map((user) => ({
      id: user._id,
      name: user.fullName,
      email: user.email,
      role: user.role,
      registrationCountryName: user.registrationCountryName || 'Unknown',
      registrationCountryCode: user.registrationCountryCode || null,
      registrationIp: user.registrationIp || null,
      createdAt: user.createdAt,
    })),
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
};
