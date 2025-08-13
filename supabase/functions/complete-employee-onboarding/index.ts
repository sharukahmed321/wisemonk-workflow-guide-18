import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OnboardingData {
  personalInfo: {
    phoneNumber: string;
    genderIdentity: string;
    dateOfBirth?: Date;
    profilePicture?: File;
  };
  bankDetails: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    hasUAN: boolean;
    uanNumber?: string;
    cancelledCheque?: File;
  };
  documentCollection: {
    graduationCert?: File;
    relievingLetter?: File;
    resume?: File;
    passport?: File;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting onboarding completion process...')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse form data
    const formData = await req.formData()
    const employeeId = formData.get('employeeId') as string
    const onboardingDataStr = formData.get('onboardingData') as string
    
    if (!employeeId || !onboardingDataStr) {
      throw new Error('Missing required fields: employeeId or onboardingData')
    }

    const onboardingData: OnboardingData = JSON.parse(onboardingDataStr)
    console.log('Parsed onboarding data for employee:', employeeId)

    // Get current employee data to ensure we have the organization_id
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('organization_id, email')
      .eq('id', employeeId)
      .single()

    if (employeeError || !employee) {
      throw new Error(`Employee not found: ${employeeError?.message}`)
    }

    console.log('Found employee:', employee.email)

    // Upload files and get URLs
    const documentUrls: Record<string, string> = {}
    
    // Helper function to upload file
    const uploadFile = async (file: File, type: string): Promise<string> => {
      const fileName = `${employeeId}/onboarding/${type}/${Date.now()}-${file.name}`
      
      const { data, error } = await supabase.storage
        .from('employee-documents')
        .upload(fileName, file, {
          contentType: file.type,
          upsert: false
        })

      if (error) {
        console.error(`Error uploading ${type}:`, error)
        throw new Error(`Failed to upload ${type}: ${error.message}`)
      }

      const { data: { publicUrl } } = supabase.storage
        .from('employee-documents')
        .getPublicUrl(data.path)

      console.log(`Uploaded ${type} to:`, publicUrl)
      return publicUrl
    }

    // Upload profile picture
    if (onboardingData.personalInfo.profilePicture) {
      documentUrls.profile_picture_url = await uploadFile(
        onboardingData.personalInfo.profilePicture, 
        'profile-picture'
      )
    }

    // Upload bank proof document
    if (onboardingData.bankDetails.cancelledCheque) {
      documentUrls.bank_proof_document_url = await uploadFile(
        onboardingData.bankDetails.cancelledCheque, 
        'bank-proof'
      )
    }

    // Upload other documents
    if (onboardingData.documentCollection.graduationCert) {
      documentUrls.graduation_certificate_url = await uploadFile(
        onboardingData.documentCollection.graduationCert, 
        'graduation-certificate'
      )
    }

    if (onboardingData.documentCollection.relievingLetter) {
      documentUrls.relieving_letter_url = await uploadFile(
        onboardingData.documentCollection.relievingLetter, 
        'relieving-letter'
      )
    }

    if (onboardingData.documentCollection.resume) {
      documentUrls.resume_url = await uploadFile(
        onboardingData.documentCollection.resume, 
        'resume'
      )
    }

    if (onboardingData.documentCollection.passport) {
      documentUrls.passport_url = await uploadFile(
        onboardingData.documentCollection.passport, 
        'passport'
      )
    }

    console.log('All files uploaded successfully')

    // Prepare update data
    const updateData = {
      // Personal info mapping
      phone: onboardingData.personalInfo.phoneNumber,
      gender: onboardingData.personalInfo.genderIdentity,
      date_of_birth: onboardingData.personalInfo.dateOfBirth ? 
        new Date(onboardingData.personalInfo.dateOfBirth).toISOString().split('T')[0] : null,
      
      // Banking details mapping
      bank_name: onboardingData.bankDetails.bankName,
      account_number: onboardingData.bankDetails.accountNumber,
      ifsc_code: onboardingData.bankDetails.ifscCode,
      has_uan: onboardingData.bankDetails.hasUAN,
      uan_number: onboardingData.bankDetails.uanNumber || null,
      
      // Document URLs
      ...documentUrls,
      
      // Update status to Active after onboarding completion
      status: 'Active',
      updated_at: new Date().toISOString()
    }

    // Update employee record
    const { error: updateError } = await supabase
      .from('employees')
      .update(updateData)
      .eq('id', employeeId)

    if (updateError) {
      console.error('Error updating employee:', updateError)
      throw new Error(`Failed to update employee: ${updateError.message}`)
    }

    console.log('Employee record updated successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Onboarding completed successfully',
        employeeId: employeeId
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in onboarding completion:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        success: false
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})