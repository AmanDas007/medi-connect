export const mockDoctors = [
    {
      _id: 'doc-1',
      name: 'Dr. Raj Yadav',
      specialization: 'Cardiologist',
      profileUrl: null,
      experienceYears: 8,
      consultationFee: 700,
      averageRating: 4.8,
      totalFeedbacks: 126,
      clinic: {
        name: 'HeartCare Clinic',
        address: 'Block A, Park Street, near Metro Gate 2',
        city: 'Kolkata',
        state: 'West Bengal',
        pincode: '700016',
      },
      availability: [
        {
          dayOfWeek: 1,
          isAvailable: true,
          slots: [
            { startTime: '09:00', endTime: '11:00' },
            { startTime: '17:00', endTime: '20:00' },
          ],
        },
        {
          dayOfWeek: 2,
          isAvailable: true,
          slots: [{ startTime: '10:00', endTime: '13:00' }],
        },
        {
          dayOfWeek: 4,
          isAvailable: true,
          slots: [{ startTime: '16:00', endTime: '19:00' }],
        },
      ],
      about:
        'Experienced cardiologist focused on chest pain, palpitations, ECG consultation, high blood pressure and heart-related discomfort.',
    },
    {
      _id: 'doc-2',
      name: 'Dr. Akshay Khanna',
      specialization: 'Dentist',
      profileUrl: null,
      experienceYears: 5,
      consultationFee: 500,
      averageRating: 4.6,
      totalFeedbacks: 89,
      clinic: {
        name: 'Smile Dental Studio',
        address: 'Salt Lake Sector 2, beside City Centre',
        city: 'Kolkata',
        state: 'West Bengal',
        pincode: '700091',
      },
      availability: [
        {
          dayOfWeek: 1,
          isAvailable: true,
          slots: [{ startTime: '10:00', endTime: '14:00' }],
        },
        {
          dayOfWeek: 3,
          isAvailable: true,
          slots: [{ startTime: '15:00', endTime: '19:00' }],
        },
        {
          dayOfWeek: 5,
          isAvailable: true,
          slots: [{ startTime: '10:00', endTime: '13:00' }],
        },
      ],
      about:
        'Dental specialist for tooth pain, cavity treatment, gum problems, dental cleaning and routine oral care.',
    },
    {
      _id: 'doc-3',
      name: 'Dr. Priya Mehta',
      specialization: 'Dermatologist',
      profileUrl: null,
      experienceYears: 10,
      consultationFee: 650,
      averageRating: 4.9,
      totalFeedbacks: 203,
      clinic: {
        name: 'SkinGlow Clinic',
        address: 'Ballygunge Circular Road, opposite Lake Mall',
        city: 'Kolkata',
        state: 'West Bengal',
        pincode: '700019',
      },
      availability: [
        {
          dayOfWeek: 2,
          isAvailable: true,
          slots: [{ startTime: '11:00', endTime: '14:00' }],
        },
        {
          dayOfWeek: 4,
          isAvailable: true,
          slots: [{ startTime: '17:00', endTime: '20:00' }],
        },
        {
          dayOfWeek: 6,
          isAvailable: true,
          slots: [{ startTime: '10:00', endTime: '12:00' }],
        },
      ],
      about:
        'Dermatologist for acne, allergy, rashes, skin infection, hair fall and cosmetic skin consultation.',
    },
    {
      _id: 'doc-4',
      name: 'Dr. Hemant Sinha',
      specialization: 'General Physician',
      profileUrl: null,
      experienceYears: 12,
      consultationFee: 450,
      averageRating: 4.7,
      totalFeedbacks: 178,
      clinic: {
        name: 'MediCare Family Clinic',
        address: 'Dumdum Road, near station market',
        city: 'Kolkata',
        state: 'West Bengal',
        pincode: '700074',
      },
      availability: [
        {
          dayOfWeek: 1,
          isAvailable: true,
          slots: [{ startTime: '08:00', endTime: '11:00' }],
        },
        {
          dayOfWeek: 3,
          isAvailable: true,
          slots: [{ startTime: '18:00', endTime: '21:00' }],
        },
        {
          dayOfWeek: 6,
          isAvailable: true,
          slots: [{ startTime: '09:00', endTime: '12:00' }],
        },
      ],
      about:
        'General physician for fever, cough, weakness, body pain, allergy, stomach issues and first-level diagnosis.',
    },
  ]