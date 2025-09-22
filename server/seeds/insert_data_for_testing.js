const { hashPassword } = require('../src/utilities/jwt.js');
const { v4: uuidv4 } = require('uuid');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function (knex) {
  // Deletes ALL existing entries

  await knex('fiscal_periods').del();
  await knex('fiscal_years').del();
  await knex('users').del()
  await knex('businesses').del();

  const password = await hashPassword('Test1234');

  await knex('users').insert([
    { username: 'master', email: 'master@example.com', password: password, status: 'active', role: 'master' },
  ]);

  // --- Businesses with detailed JSON ---
  const businesses = [
    {
      id: uuidv4(),
      name: 'Acme Trading Co.',
      email: 'info@acmetrading.com',
      data: {
        country: 'USA',
        business_type: 'Partnership',
        mcc: '5311', // Department Stores
        industry: 'Retail',
        legal_name: 'Acme Trading Company LLC',
        legal_address: {
          line1: '123 Main Street',
          line2: 'Suite 400',
          zip: '94105',
          city: 'San Francisco',
          country: 'USA',
        },
        dba_name: 'Acme Retail',
        dba_address: {
          line1: '456 Market Street',
          line2: '',
          zip: '94107',
          city: 'San Francisco',
          country: 'USA',
        },
        product_service_details: 'General retail goods, clothing, and household items',
        registration_no: 'TIN-452367891',
      },
    },
    {
      id: uuidv4(),
      name: 'Bright Future Tech',
      email: 'contact@brightfuture.io',
      data: {
        country: 'Germany',
        business_type: 'Single Member LLC',
        mcc: '5734', // Computer Software Stores
        industry: 'Software Development',
        legal_name: 'Bright Future Technologies GmbH',
        legal_address: {
          line1: 'Tech Park 5',
          line2: '',
          zip: '10115',
          city: 'Berlin',
          country: 'Germany',
        },
        dba_name: 'BFT Software',
        dba_address: {
          line1: 'Innovation Hub, Room 21',
          line2: '',
          zip: '10117',
          city: 'Berlin',
          country: 'Germany',
        },
        product_service_details: 'Cloud SaaS applications and AI tools',
        registration_no: 'DE123456789',
      },
    },
    {
      id: uuidv4(),
      name: 'GreenLeaf Foods',
      email: 'hello@greenleaffoods.org',
      data: {
        country: 'Pakistan',
        business_type: 'Sole Proprietorship',
        mcc: '5812', // Eating Places, Restaurants
        industry: 'Food & Beverages',
        legal_name: 'GreenLeaf Organic Foods',
        legal_address: {
          line1: '12 Garden Avenue',
          line2: 'Block B',
          zip: '75500',
          city: 'Karachi',
          country: 'Pakistan',
        },
        dba_name: 'GreenLeaf Cafe',
        dba_address: {
          line1: '45 Food Street',
          line2: '',
          zip: '75510',
          city: 'Karachi',
          country: 'Pakistan',
        },
        product_service_details: 'Organic food products, cafes, and catering services',
        registration_no: 'PK-NTN-987654321',
      },
    },
  ];

  await knex('businesses').insert(businesses);

  // --- Fiscal Years & Periods ---
  for (const business of businesses) {
    for (const year of [2022, 2023, 2024]) {
      const fyId = uuidv4();
      const startDate = new Date(year, 0, 1); // Jan 1
      const endDate = new Date(year, 11, 31); // Dec 31

      await knex('fiscal_years').insert({
        id: fyId,
        business_id: business.id,
        year_label: year.toString(),
        start_date: startDate,
        end_date: endDate,
        is_closed: year < 2024, // older years closed
      });

      // Generate 12 monthly periods
      for (let month = 0; month < 12; month++) {
        const pId = uuidv4();
        const pStart = new Date(year, month, 1);
        const pEnd = new Date(year, month + 1, 0); // last day of month

        await knex('fiscal_periods').insert({
          id: pId,
          fiscal_year_id: fyId,
          period_no: month + 1,
          start_date: pStart,
          end_date: pEnd,
          is_closed: year < 2024, // close previous years
        });
      }
    }
  }


  // Create admin users for each business
  const adminUsers = businesses.map((biz, idx) => {
    return {
      id: uuidv4(),
      username: `${biz.name.replace(/\s+/g, '').toLowerCase()}_admin`,
      email: `admin${idx + 1}@${biz.name.replace(/\s+/g, '').toLowerCase()}.com`,
      password: password,
      status: 'active',
      role: 'admin',
      business_id: biz.id,
    };
  });

  console.log('adminUsers', adminUsers);

  await knex('users').insert(adminUsers);


};
