"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Users, ArrowLeft, Calendar, AlertCircle } from "lucide-react";
import { 
  GENDERS, 
  AGE_GROUPS, 
  SHIRT_SIZES,
  EventParticipationRole,
  JAPANESE_PROVINCES,
  PROVINCE_DIOCESE_MAPPING,
  EventConfig,
  EventRole,
  GenderType
} from "@/lib/types";
import { toast } from "sonner";
import { RoleSelection } from "./role-selection";
import { createClient } from "@/lib/supabase/client";

// Primary registrant schema (full details) - facebook_link is required for primary
const primaryRegistrantSchema = z.object({
  saint_name: z.string().optional(),
  full_name: z.string().min(1, "Họ và tên là bắt buộc"),
  gender: z.enum(['male', 'female', 'other'] as const, {
    required_error: "Vui lòng chọn giới tính"
  }),
  age_group: z.enum(['under_12','12_17', '18_25', '26_35', '36_50', 'over_50'] as const, {
    required_error: "Vui lòng chọn độ tuổi"
  }),
  province: z.string().min(1, "Tỉnh/Phủ là bắt buộc").refine((val) => val && val.trim() !== '', {
    message: "Tỉnh/Phủ là bắt buộc cho người đăng ký chính"
  }),
  diocese: z.string().min(1, "Giáo phận là bắt buộc"),
  shirt_size: z.enum(['1','2','3','4','5','M-XS', 'M-S', 'M-M', 'M-L', 'M-XL', 'M-XXL', 'M-3XL', 'M-4XL', 'F-XS', 'F-S', 'F-M', 'F-L', 'F-XL', 'F-XXL'] as const, {
    required_error: "Vui lòng chọn size áo"
  }),
  event_role: z.string() as z.ZodType<EventParticipationRole>,
  is_primary: z.boolean(),
  go_with: z.boolean(),
  notes: z.string().optional(),
  // Facebook link is required for primary registrant
  facebook_link: z.string().url("Link Facebook không hợp lệ").min(1, "Link Facebook là bắt buộc cho người đăng ký chính").refine((val) => val && val.trim() !== '', {
    message: "Link Facebook là bắt buộc cho người đăng ký chính"
  }),
  // Optional contact fields
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  phone: z.string().optional().refine((val) => {
    if (!val || val === "") return true;
    return val.length >= 10 && /^\+?[0-9\s\-\(\)]+$/.test(val);
  }, "Số điện thoại không hợp lệ"),
  address: z.string().optional(),
});

// Additional registrant schema (simplified) - all optional except core required fields
const additionalRegistrantSchema = z.object({
  saint_name: z.string().optional(),
  full_name: z.string().min(1, "Họ và tên là bắt buộc"),
  gender: z.enum(['male', 'female', 'other'] as const, {
    required_error: "Vui lòng chọn giới tính"
  }),
  age_group: z.enum(['under_12', '12_17', '18_25', '26_35', '36_50', 'over_50'] as const, {
    required_error: "Vui lòng chọn độ tuổi"
  }),
  province: z.string().optional(),
  diocese: z.string().optional(),
  shirt_size: z.enum(['1','2','3','4','5','M-XS', 'M-S', 'M-M', 'M-L', 'M-XL', 'M-XXL', 'M-3XL', 'M-4XL', 'F-XS', 'F-S', 'F-M', 'F-L', 'F-XL', 'F-XXL'] as const, {
    required_error: "Vui lòng chọn size áo"
  }),
  event_role: z.string() as z.ZodType<EventParticipationRole>,
  is_primary: z.boolean(),
  go_with: z.boolean(),
  notes: z.string().optional(),
  // Optional contact fields
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  phone: z.string().optional().refine((val) => {
    if (!val || val === "") return true;
    return val.length >= 10 && /^\+?[0-9\s\-\(\)]+$/.test(val);
  }, "Số điện thoại không hợp lệ"),
  address: z.string().optional(),
  facebook_link: z.string().url("Link Facebook không hợp lệ").optional().or(z.literal("")),
});

// Combined schema - simpler approach
const registrantSchema = z.union([primaryRegistrantSchema, additionalRegistrantSchema]);

const formSchema = z.object({
  registrants: z.array(registrantSchema).min(1, "Phải có ít nhất 1 người tham gia"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface RegistrationFormProps {
  userEmail?: string;
  userName?: string;
  userFacebookUrl?: string;
}

export function RegistrationForm({ userEmail, userName, userFacebookUrl }: RegistrationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<'role-selection' | 'registration'>('role-selection');
  const [selectedRole, setSelectedRole] = useState<EventParticipationRole>('participant');
  const [eventConfig, setEventConfig] = useState<EventConfig | null>(null);
  const [eventRoles, setEventRoles] = useState<EventRole[]>([]);
  //const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const supabase = createClient();

  // Utility function to get role display name
  const getRoleDisplayName = (role: EventParticipationRole): string => {
    if (role === 'participant') return 'Tham dự viên';
    const eventRole = eventRoles.find(r => r.id === role);
    return eventRole ? eventRole.name : 'Chưa chọn';
  };

  // Utility function to get available roles for additional registrants
  const getAvailableRolesForAdditional = () => {
    const baseRoles = [{ id: 'participant', name: 'Tham dự viên' }];
    if (selectedRole !== 'participant') {
      const selectedRoleObj = eventRoles.find(r => r.id === selectedRole);
      if (selectedRoleObj) {
        baseRoles.push({ id: selectedRoleObj.id, name: selectedRoleObj.name });
      }
    }
    return baseRoles;
  };

  // Fetch active event config and roles
  useEffect(() => {
    const fetchEventData = async () => {
      //setIsLoadingRoles(true);
      try {
        // Fetch event config
        const response = await fetch('/api/admin/events');
        if (response.ok) {
          const { events } = await response.json();
          const activeEvent = events?.find((event: EventConfig) => event.is_active);
          setEventConfig(activeEvent || null);
          
          // Fetch event roles if we have an active event
          if (activeEvent) {
            const { data: roles, error: rolesError } = await supabase
              .from('event_roles')
              .select('*')
              .eq('event_config_id', activeEvent.id)
              .order('name');

            if (rolesError) {
              console.error('Error fetching event roles:', rolesError);
            } else {
              setEventRoles(roles || []);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch event data:', error);
      } finally {
       // setIsLoadingRoles(false);
      }
    };

    fetchEventData();
  }, [supabase]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      registrants: [
        {
          saint_name: "",
          full_name: userName || "",
          gender: "male" as const,
          age_group: "18_25" as const,
          province: "",
          diocese: "",
          shirt_size: "M-M" as const,
          event_role: "participant",
          is_primary: true,
          go_with: false,
          notes: "",
          // Optional fields
          email: userEmail || "",
          phone: "",
          address: "",
          facebook_link: userFacebookUrl || "",
        }
      ],
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "registrants",
  });

  const registrants = watch("registrants");
  const basePrice = eventConfig?.base_price || 6000; // Dynamic price from event config
  const totalAmount = registrants.reduce((total, registrant) => {
    const price = registrant.age_group === 'under_12' ? basePrice * 0.5 : basePrice;
    return total + price;
  }, 0);

  const handleRoleSelection = (role: EventParticipationRole) => {
    setSelectedRole(role);
    // Update the primary registrant's role
    setValue("registrants.0.event_role", role);
  };

  const proceedToRegistration = () => {
    setCurrentStep('registration');
    // Scroll to top for better UX when moving to registration step
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBackToRoleSelection = () => {
    setCurrentStep('role-selection');
  };

  const addRegistrant = () => {
    append({
      saint_name: "",
      full_name: "",
      gender: "male" as const,
      age_group: "26_35" as const,
      shirt_size: "M-M" as const,
      event_role: selectedRole === 'participant' ? selectedRole : 'participant', // Default to participant unless primary is already participant
      is_primary: false,
      go_with: false,
      notes: "",
      // Optional fields
      email: "",
      phone: "",
      address: "",
      facebook_link: "",
      province: "",
      diocese: "",
    });
    
    // Scroll to the newly added registrant on mobile
    setTimeout(() => {
      const newRegistrantIndex = registrants.length;
      const element = document.getElementById(`registrant-${newRegistrantIndex}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleProvinceChange = (index: number, selectedProvince: string) => {
    setValue(`registrants.${index}.province` as const, selectedProvince);
    if (selectedProvince && PROVINCE_DIOCESE_MAPPING[selectedProvince]) {
      setValue(`registrants.${index}.diocese` as const, PROVINCE_DIOCESE_MAPPING[selectedProvince]);
    }
  };

  const handleGenderChange = (index: number, selectedGender: string) => {
      setValue(`registrants.${index}.gender` as const, selectedGender as GenderType);
      if (selectedGender === "female") {
        setValue(`registrants.${index}.shirt_size` as const, "F-M" as const);
      }
      if (selectedGender === "male") {
        setValue(`registrants.${index}.shirt_size` as const, "M-M" as const);
      }
  };

  const onSubmit = async (data: FormData) => {
    // Extra manual check for primary registrant
    setIsSubmitting(true);
    const primary = data.registrants[0];
    if (!primary.province || primary.province.trim() === "") {
      toast.error("Người đăng ký chính phải chọn Tỉnh/Phủ.");
      setIsSubmitting(false);
      return;
    }
    if (!primary.facebook_link || primary.facebook_link.trim() === "") {
      toast.error("Người đăng ký chính phải nhập Link Facebook.");
      setIsSubmitting(false);
      return;
    }
    try {
      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registrants: data.registrants.map(registrant => ({
            ...registrant,
            saint_name: registrant.saint_name?.toUpperCase() || "",
            full_name: registrant.full_name.toUpperCase(),
            email: registrant.is_primary ? registrant.email : data.registrants[0].email,
            phone: registrant.is_primary ? registrant.phone : data.registrants[0].phone,
            address: registrant.is_primary ? registrant.address : data.registrants[0].address,
            province: registrant.is_primary ? registrant.province : data.registrants[0].province,
            diocese: registrant.is_primary ? registrant.diocese : data.registrants[0].diocese,
          })),
          notes: data.notes,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }

      toast.success("Đăng ký thành công! Bạn sẽ được chuyển đến trang thanh toán.");
      
      // Redirect to payment page
      window.location.href = `/payment/${result.invoiceCode}`;

    } catch (error) {
      toast.error(`Có lỗi xảy ra trong quá trình đăng ký. Vui lòng thử lại. ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Always call useEffect, check currentStep inside
  useEffect(() => {
    if (currentStep === 'registration') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  // Step 1: Role Selection
  if (currentStep === 'role-selection') {
    return (
      <div className="max-w-4xl mx-auto">
        <RoleSelection
            selectedRole={selectedRole}
            onRoleSelect={handleRoleSelection}
            onContinue={proceedToRegistration}
          />
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto relative">
      {/* Floating Add Button for Mobile */}
      <div className="fixed bottom-20 right-4 z-50 sm:hidden">
        <div className="flex flex-col items-end space-y-2">
          {registrants.length > 1 && (
            <div className="bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-medium">
              {registrants.length} người
            </div>
          )}
          <Button
            type="button"
            size="lg"
            onClick={addRegistrant}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full h-12 w-12 shadow-lg transform hover:scale-105 transition-all"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      </div>
      {/* Progress indicator */}
      <div className="flex items-center justify-center space-x-6 mb-8">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold border-2 border-green-200 shadow-lg">
            ✓
          </div>
          <span className="text-sm text-green-600 dark:text-green-400 font-semibold">Chọn vai trò</span>
        </div>
        <div className="h-1 bg-gradient-to-r from-green-400 to-blue-400 w-12 rounded-full"></div>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg transform hover:scale-105 transition-transform">
            2
          </div>
          <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Điền thông tin</span>
        </div>
      </div>

      <div className="mb-6">
        <Button
          type="button"
          variant="ghost"
          onClick={goBackToRoleSelection}
          className="mb-4 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Thay đổi vai trò
        </Button>
        
        <div className="text-center space-y-6">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-700 to-purple-600 bg-clip-text text-transparent">
            ✨ Đăng ký tham gia
          </h2>
          <div className="inline-block bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-2 border-blue-200 dark:border-blue-700 rounded-full px-8 py-4 shadow-lg">
            <p className="text-gray-700 dark:text-gray-200 text-lg">
              <span className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full shadow-md">
                {getRoleDisplayName(selectedRole)}
              </span>
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Registrants */}
        <Card className=" border-blue-200 dark:border-blue-800 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full">
                  <Users className="h-5 w-5 text-white" />
                </div>
                Đăng ký cho {registrants.length} người
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRegistrant}
                className="hidden sm:flex bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-600 text-blue-600 hover:from-blue-100 hover:to-purple-100 hover:border-blue-700 transform hover:scale-105 transition-all shadow-md"
              >
                <Plus className="h-4 w-4 mr-2" />
                Thêm người
              </Button>
            </div>
            {/* Mobile add button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addRegistrant}
              className="sm:hidden w-full mt-4 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-600 text-blue-600 hover:from-blue-100 hover:to-purple-100 hover:border-blue-700 shadow-md"
            >
              <Plus className="h-4 w-4 mr-2" />
              Thêm người
            </Button>
          </CardHeader>
          <CardContent className="space-y-8">
            {fields.map((field, index) => {
              const isPrimary = index === 0;
              
              return (
                <div key={field.id} id={`registrant-${index}`} className="border border-gray-600 rounded-lg p-4 sm:p-6 relative">
                  {registrants.length > 1 && !isPrimary && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 h-8 w-8 p-0"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-sm sm:text-base">
                      {isPrimary ? `Người đăng ký chính` : `Người tham gia ${index + 1}`}
                    </h4>
                    {isPrimary && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        {getRoleDisplayName(selectedRole)}
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Core required fields for all registrants */}
                    <div className="space-y-2">
                      <Label htmlFor={`registrants.${index}.saint_name`}>Tên Thánh</Label>
                      <Input
                        id={`registrants.${index}.saint_name`}
                        {...register(`registrants.${index}.saint_name`)}
                        placeholder="Tên thánh bảo trợ"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`registrants.${index}.full_name`}>Họ và Tên *</Label>
                      <Input
                        id={`registrants.${index}.full_name`}
                        {...register(`registrants.${index}.full_name`)}
                        placeholder="Nguyễn Văn A"
                      />
                      {errors.registrants?.[index]?.full_name && (
                        <p className="text-sm text-destructive">
                          {errors.registrants[index]?.full_name?.message}
                        </p>
                      )}
                      {isPrimary && userName && (
                        <p className="text-xs text-muted-foreground">
                          Tên từ tài khoản: {userName}. Bạn có thể chỉnh sửa nếu cần.
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`registrants.${index}.gender`}>Giới tính *</Label>
                      <select
                        id={`registrants.${index}.gender`}
                        {...register(`registrants.${index}.gender`)}
                        onChange={(e) => handleGenderChange(index, e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Chọn giới tính</option>
                        {GENDERS.map((gender) => (
                          <option key={gender.value} value={gender.value}>
                            {gender.label}
                          </option>
                        ))}
                      </select>
                      {errors.registrants?.[index]?.gender && (
                        <p className="text-sm text-destructive">
                          {errors.registrants[index]?.gender?.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`registrants.${index}.age_group`}>Độ tuổi *</Label>
                      <select
                        id={`registrants.${index}.age_group`}
                        {...register(`registrants.${index}.age_group`)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Chọn độ tuổi</option>
                        {AGE_GROUPS.map((age) => (
                          <option key={age.value} value={age.value}>
                            {age.label}
                          </option>
                        ))}
                      </select>
                      {errors.registrants?.[index]?.age_group && (
                        <p className="text-sm text-destructive">
                          {errors.registrants[index]?.age_group?.message}
                        </p>
                      )}
                    </div>

                    {/* Required location fields for primary registrant */}
                    {isPrimary && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor={`registrants.${index}.province`}>Tỉnh/Phủ *</Label>
                          <select
                            id={`registrants.${index}.province`}
                            {...register(`registrants.${index}.province`)}
                            onChange={(e) => handleProvinceChange(index, e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">Chọn tỉnh/phủ</option>
                            {JAPANESE_PROVINCES.map((province) => (
                              <option key={province.value} value={province.value}>
                                {province.label}
                              </option>
                            ))}
                          </select>
                          {errors.registrants?.[index]?.province && (
                            <p className="text-sm text-destructive">
                              {errors.registrants[index]?.province?.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`registrants.${index}.diocese`}>Giáo phận *</Label>
                          <Input
                            id={`registrants.${index}.diocese`}
                            {...register(`registrants.${index}.diocese`)}
                            placeholder="Tự động điền khi chọn tỉnh"
                            readOnly
                            className="bg-muted"
                          />
                          {errors.registrants?.[index]?.diocese && (
                            <p className="text-sm text-destructive">
                              {errors.registrants[index]?.diocese?.message}
                            </p>
                          )}
                        </div>
                      </>
                    )}
                    {!isPrimary && selectedRole !== 'participant' && (
                      <div className="space-y-2">
                        <Label htmlFor={`registrants.${index}.event_role`}>Vai trò tham gia *</Label>
                        <select
                          id={`registrants.${index}.event_role`}
                          {...register(`registrants.${index}.event_role`)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {
                            // Additional registrants can only choose between participant and the primary's role
                            getAvailableRolesForAdditional()
                              .map((role) => (
                                <option key={role.id} value={role.id}>
                                  {role.name}
                                </option>
                              ))
                        }
                        </select>
                        {errors.registrants?.[index]?.event_role && (
                          <p className="text-sm text-destructive">
                            {errors.registrants[index]?.event_role?.message}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Người tham gia thêm chỉ có thể chọn giữa &quot;Người tham gia&quot; hoặc &quot;{getRoleDisplayName(selectedRole)}&quot;.
                        </p>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor={`registrants.${index}.shirt_size`}>Size áo *</Label>
                      <select
                        id={`registrants.${index}.shirt_size`}
                        {...register(`registrants.${index}.shirt_size`)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Chọn size</option>
                        {SHIRT_SIZES.map((size) => (
                          <option key={size.value} value={size.value}>
                            {size.label}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-muted-foreground">
                          Chọn size áo theo cân nặng và giới tính.
                          Áo dành cho trẻ em dưới 12 tuổi sẽ không phân biệt giới tính.
                      </p>
                      {errors.registrants?.[index]?.shirt_size && (
                        <p className="text-sm text-destructive">
                          {errors.registrants[index]?.shirt_size?.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                          <Label htmlFor={`registrants.${index}.facebook_link`}>
                            Link Facebook {isPrimary ? "*" : ""}
                          </Label>
                          <Input
                            id={`registrants.${index}.facebook_link`}
                            {...register(`registrants.${index}.facebook_link`)}
                            placeholder="https://facebook.com/username"
                          />
                          {errors.registrants?.[index]?.facebook_link && (
                            <p className="text-sm text-destructive">
                              {errors.registrants[index]?.facebook_link?.message}
                            </p>
                          )}
                          {isPrimary && userFacebookUrl && (
                            <p className="text-xs text-muted-foreground">
                              Tự động điền từ tài khoản của bạn
                            </p>
                          )}
                          {isPrimary && !userFacebookUrl && (
                            <div className="text-xs text-orange-600 bg-orange-50 p-3 rounded-lg border border-orange-200">
                              Link facebook được lấy ở phần cài đặt trong trang cá nhân → 
                              Bấm vào dấu ... bên cạnh nút chỉnh sửa trang cá nhân → Kéo xuống phía dưới cùng, bạn sẽ thấy chữ copy link, bấm vào đó để sao chép → dán vào đây.
                            </div>
                          )}
                    </div>

                      <div className="space-y-2 mt-2">
                        <Label htmlFor={`registrants.${index}.go_with`}>Bạn có nhu cầu đi xe chung không?</Label>
                        <Input
                          type="checkbox"
                          id={`registrants.${index}.go_with`}
                          {...register(`registrants.${index}.go_with`)}
                          className="h-4 w-4"
                        />
                        <p className="text-xs text-muted-foreground">
                          Lưu ý: Nếu bạn muốn đi chung với nhóm hoặc cộng đoàn ở gần bạn, hãy chọn ô này.
                          Thông tin về các nhóm hoặc cộng đoàn có tổ chức xe chung sẽ được cập nhật sau,
                          vui lòng theo dõi trang web hoặc nhóm Facebook của sự kiện để biết thêm chi tiết.
                        </p>
                      </div>

                    {/* Optional contact information section */}
                    <div className="md:col-span-2 border-t border-gray-800 pt-4 mt-6">
                      <h5 className="font-medium mb-3">
                        Phần thông tin không bắt buộc (tùy chọn)
                      </h5>
                      {isPrimary && (
                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`registrants.${index}.email`}>Email</Label>
                            <Input
                              id={`registrants.${index}.email`}
                              {...register(`registrants.${index}.email`)}
                              placeholder="example@email.com"
                            />
                            {errors.registrants?.[index]?.email && (
                              <p className="text-sm text-destructive">
                                {errors.registrants[index]?.email?.message}
                              </p>
                            )}
                            {isPrimary && userFacebookUrl && (
                              <p className="text-xs text-muted-foreground">
                                Nếu bạn không có facebook hoặc không muốn cung cấp, hãy nhập email để ban tổ chức có thể liên hệ với bạn.
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`registrants.${index}.phone`}>Số điện thoại</Label>
                            <Input
                              id={`registrants.${index}.phone`}
                              {...register(`registrants.${index}.phone`)}
                              placeholder="090-1234-5678"
                            />
                            {errors.registrants?.[index]?.phone && (
                              <p className="text-sm text-destructive">
                                {errors.registrants[index]?.phone?.message}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Ít nhất 10 số, có thể bao gồm +, dấu cách, dấu gạch ngang
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`registrants.${index}.address`}>Địa chỉ</Label>
                            <Input
                              id={`registrants.${index}.address`}
                              {...register(`registrants.${index}.address`)}
                              placeholder="Địa chỉ hiện tại tại Nhật Bản"
                            />
                            {errors.registrants?.[index]?.address && (
                              <p className="text-sm text-destructive">
                                {errors.registrants[index]?.address?.message}
                              </p>
                            )}
                          </div>
                        </div>
                        )}
                      <div className="space-y-2 md:col-span-2 mt-2">
                          <Label htmlFor={`registrants.${index}.notes`}>Ý kiến/Ghi chú</Label>
                          <Textarea
                            id={`registrants.${index}.notes`}
                            {...register(`registrants.${index}.notes`)}
                            placeholder="Ý kiến đóng góp hoặc yêu cầu đặc biệt"
                            className="min-h-[80px]"
                          />
                        </div>
                    </div>

                    {/* Hidden fields */}
                    <input type="hidden" {...register(`registrants.${index}.event_role`)} />
                    <input type="hidden" {...register(`registrants.${index}.is_primary`)} />
                  </div>
                  
                  {/* Add person button after each registrant (except the last one) */}
                  {index < registrants.length - 1 && (
                    <div className="flex justify-center mt-4 pt-4 border-t border-dashed">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={addRegistrant}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Thêm người tham gia
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Final add button at the bottom */}
            <div className="flex justify-center pt-4 border-t border-dashed">
              <Button
                type="button"
                variant="outline"
                onClick={addRegistrant}
                className="w-full sm:w-auto border-2 border-blue-600 text-blue-600 hover:bg-blue-50 transform hover:scale-105 transition-all"
              >
                <Plus className="h-4 w-4 mr-2" />
                Thêm người tham gia
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Cancellation Policy */}
        {eventConfig?.cancellation_deadline && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Chính sách hủy đăng ký
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="font-medium text-amber-800">
                    Hạn chót hủy đăng ký: {new Date(eventConfig.cancellation_deadline).toLocaleDateString('vi-VN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <p className="text-sm text-amber-700">
                    Sau thời hạn này, phí đăng ký sẽ không được hoàn lại. Vui lòng cân nhắc kỹ trước khi đăng ký.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Tổng kết đăng ký</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Vai trò tham gia:</span>
                <span className="font-medium">
                  {getRoleDisplayName(selectedRole)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Số người tham gia:</span>
                <span className="font-medium">{registrants.length}</span>
              </div>
              {/* Show breakdown by age group */}
              {registrants.some(r => r.age_group === 'under_12') && (
                <div className="text-sm space-y-1 pl-4 border-l-2 border-blue-200">
                  <div className="flex justify-between">
                    <span>Trẻ em dưới 12 tuổi ({registrants.filter(r => r.age_group === 'under_12').length} người):</span>
                    <span>¥{(basePrice * 0.5).toLocaleString()}/người</span>
                  </div>
                  {registrants.some(r => r.age_group !== 'under_12') && (
                    <div className="flex justify-between">
                      <span>Từ 12 tuổi trở lên ({registrants.filter(r => r.age_group !== 'under_12').length} người):</span>
                      <span>¥{basePrice.toLocaleString()}/người</span>
                    </div>
                  )}
                </div>
              )}
              {!registrants.some(r => r.age_group === 'under_12') && (
                <div className="flex justify-between">
                  <span>Chi phí mỗi người:</span>
                  <span className="font-medium">¥{basePrice.toLocaleString()}</span>
                </div>
              )}
              <div className="border-t pt-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Tổng chi phí:</span>
                  <span>¥{totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-center pt-8">
          <Button 
            type="submit" 
            size="lg" 
            disabled={isSubmitting}
            className="min-w-[280px] h-14 text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-4 rounded-full shadow-2xl transform hover:scale-110 transition-all duration-300 disabled:transform-none disabled:opacity-50 border-2 border-white/20"
          >
            {isSubmitting ? "⏳ Đang xử lý..." : "✨ Hoàn tất đăng ký 🎉"}
          </Button>
        </div>
      </form>
    </div>
  );
}