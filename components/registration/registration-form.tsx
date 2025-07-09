"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Users, ArrowLeft } from "lucide-react";
import { 
  GENDERS, 
  AGE_GROUPS, 
  SHIRT_SIZES,
  EventParticipationRole,
  EVENT_PARTICIPATION_ROLES,
  JAPANESE_PROVINCES,
  PROVINCE_DIOCESE_MAPPING
} from "@/lib/types";
import { toast } from "sonner";
import { RoleSelection } from "./role-selection";

// Primary registrant schema (full details)
const primaryRegistrantSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  saint_name: z.string().optional(),
  full_name: z.string().min(1, "Họ và tên là bắt buộc"),
  gender: z.enum(['male', 'female', 'other'] as const, {
    required_error: "Vui lòng chọn giới tính"
  }),
  age_group: z.enum(['under_18', '18_25', '26_35', '36_50', 'over_50'] as const, {
    required_error: "Vui lòng chọn độ tuổi"
  }),
  province: z.string().min(1, "Tỉnh/Phủ là bắt buộc"),
  diocese: z.string().min(1, "Giáo phận là bắt buộc"),
  address: z.string().min(1, "Địa chỉ là bắt buộc"),
  facebook_link: z.string().url("Link Facebook không hợp lệ").optional().or(z.literal("")),
  phone: z.string().min(1, "Số điện thoại là bắt buộc"),
  shirt_size: z.enum(['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const, {
    required_error: "Vui lòng chọn size áo"
  }),
  event_role: z.string() as z.ZodType<EventParticipationRole>,
  is_primary: z.boolean(),
  notes: z.string().optional(),
});

// Additional registrant schema (simplified) - make optional fields truly optional
const additionalRegistrantSchema = z.object({
  email: z.string().email("Email không hợp lệ").optional(),
  saint_name: z.string().optional(),
  full_name: z.string().min(1, "Họ và tên là bắt buộc"),
  gender: z.enum(['male', 'female', 'other'] as const, {
    required_error: "Vui lòng chọn giới tính"
  }),
  age_group: z.enum(['under_18', '18_25', '26_35', '36_50', 'over_50'] as const, {
    required_error: "Vui lòng chọn độ tuổi"
  }),
  province: z.string().optional(),
  diocese: z.string().optional(),
  address: z.string().optional(),
  facebook_link: z.string().url("Link Facebook không hợp lệ").optional().or(z.literal("")),
  phone: z.string().optional(),
  shirt_size: z.enum(['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const, {
    required_error: "Vui lòng chọn size áo"
  }),
  event_role: z.string() as z.ZodType<EventParticipationRole>,
  is_primary: z.boolean(),
  notes: z.string().optional(),
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
}

export function RegistrationForm({ userEmail, userName }: RegistrationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<'role-selection' | 'registration'>('role-selection');
  const [selectedRole, setSelectedRole] = useState<EventParticipationRole>('participant');

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
          email: userEmail || "",
          saint_name: "",
          full_name: userName || "",
          gender: "male" as const,
          age_group: "26_35" as const,
          province: "",
          diocese: "",
          address: "",
          facebook_link: "",
          phone: "",
          shirt_size: "M" as const,
          event_role: "participant",
          is_primary: true,
          notes: "",
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
  const basePrice = 5000; // Base price in JPY per person
  const totalAmount = registrants.length * basePrice;

  const handleRoleSelection = (role: EventParticipationRole) => {
    setSelectedRole(role);
    // Update the primary registrant's role
    setValue("registrants.0.event_role", role);
  };

  const proceedToRegistration = () => {
    setCurrentStep('registration');
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
      shirt_size: "M" as const,
      facebook_link: "",
      event_role: selectedRole, // Use same role as primary
      is_primary: false,
      notes: "",
    });
  };

  const handleProvinceChange = (index: number, selectedProvince: string) => {
    setValue(`registrants.${index}.province` as const, selectedProvince);
    if (selectedProvince && PROVINCE_DIOCESE_MAPPING[selectedProvince]) {
      setValue(`registrants.${index}.diocese` as const, PROVINCE_DIOCESE_MAPPING[selectedProvince]);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registrants: data.registrants.map(registrant => ({
            ...registrant,
            // For additional registrants, inherit contact info from primary
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
      console.error('Registration error:', error);
      toast.error("Có lỗi xảy ra trong quá trình đăng ký. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

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

  // Step 2: Registration Form
  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress indicator */}
      <div className="flex items-center justify-center space-x-4 mb-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm font-medium">
            1
          </div>
          <span className="text-sm text-gray-500">Chọn vai trò</span>
        </div>
        <div className="h-px bg-gray-300 w-8"></div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
            2
          </div>
          <span className="text-sm font-medium text-primary">Điền thông tin</span>
        </div>
      </div>

      <div className="mb-6">
        <Button
          type="button"
          variant="ghost"
          onClick={goBackToRoleSelection}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Thay đổi vai trò
        </Button>
        
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Đăng ký tham gia</h2>
          <p className="text-muted-foreground">
            Vai trò: <span className="font-medium">
              {EVENT_PARTICIPATION_ROLES.find(r => r.value === selectedRole)?.label}
            </span>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Registrants */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Thông tin người tham gia ({registrants.length})
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRegistrant}
              >
                <Plus className="h-4 w-4 mr-2" />
                Thêm người
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            {fields.map((field, index) => {
              const isPrimary = index === 0;
              
              return (
                <div key={field.id} className="border rounded-lg p-6 relative">
                  {registrants.length > 1 && !isPrimary && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  
                  <h4 className="font-medium mb-4">
                    {isPrimary ? `Người đăng ký chính (${EVENT_PARTICIPATION_ROLES.find(r => r.value === selectedRole)?.label})` : `Người tham gia ${index + 1}`}
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Primary registrant gets full form */}
                    {isPrimary && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor={`registrants.${index}.email`}>Email *</Label>
                          <Input
                            id={`registrants.${index}.email`}
                            {...register(`registrants.${index}.email`)}
                            placeholder="example@email.com"
                            disabled={!!userEmail}
                          />
                          {errors.registrants?.[index]?.email && (
                            <p className="text-sm text-destructive">
                              {errors.registrants[index]?.email?.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`registrants.${index}.phone`}>Số điện thoại *</Label>
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
                        </div>

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

                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor={`registrants.${index}.address`}>Địa chỉ *</Label>
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
                      </>
                    )}

                    {/* Common fields for all registrants */}
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
                        disabled={isPrimary && !!userName}
                      />
                      {errors.registrants?.[index]?.full_name && (
                        <p className="text-sm text-destructive">
                          {errors.registrants[index]?.full_name?.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`registrants.${index}.gender`}>Giới tính *</Label>
                      <select
                        id={`registrants.${index}.gender`}
                        {...register(`registrants.${index}.gender`)}
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
                      {errors.registrants?.[index]?.shirt_size && (
                        <p className="text-sm text-destructive">
                          {errors.registrants[index]?.shirt_size?.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`registrants.${index}.facebook_link`}>Link Facebook</Label>
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
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor={`registrants.${index}.notes`}>Ý kiến/Ghi chú</Label>
                      <Textarea
                        id={`registrants.${index}.notes`}
                        {...register(`registrants.${index}.notes`)}
                        placeholder="Ý kiến đóng góp hoặc yêu cầu đặc biệt"
                        className="min-h-[80px]"
                      />
                    </div>

                    {/* Hidden fields */}
                    <input type="hidden" {...register(`registrants.${index}.event_role`)} />
                    <input type="hidden" {...register(`registrants.${index}.is_primary`)} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* General Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Ghi chú chung</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              {...register("notes")}
              placeholder="Ghi chú chung cho toàn bộ đăng ký (nếu có)"
              className="min-h-[100px]"
            />
          </CardContent>
        </Card>

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
                  {EVENT_PARTICIPATION_ROLES.find(r => r.value === selectedRole)?.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Số người tham gia:</span>
                <span className="font-medium">{registrants.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Chi phí mỗi người:</span>
                <span className="font-medium">¥{basePrice.toLocaleString()}</span>
              </div>
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
        <div className="flex justify-center">
          <Button 
            type="submit" 
            size="lg" 
            disabled={isSubmitting}
            className="min-w-[200px]"
          >
            {isSubmitting ? "Đang xử lý..." : "Hoàn tất đăng ký"}
          </Button>
        </div>
      </form>
    </div>
  );
}