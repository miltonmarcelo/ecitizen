import { useRef, useState } from "react";
import { motion } from "framer-motion";
import emailjs from "@emailjs/browser";
import ReCAPTCHA from "react-google-recaptcha";
import TopBar from "@/components/TopBar";

type FormData = {
  name: string;
  email: string;
  message: string;
};

type FormErrors = {
  name?: string;
  email?: string;
  message?: string;
  submit?: string;
};

const MIN_MESSAGE_LENGTH = 50;
const EMAILJS_SERVICE_ID = "service_u0wnwlc";
const EMAILJS_TEMPLATE_ID = "template_sdwe1a3";
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.35 },
});

const ContactPage = () => {
  const recaptchaRef = useRef<ReCAPTCHA | null>(null);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    message: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const validateName = (name: string) => {
    const trimmed = name.trim();
    const parts = trimmed.split(/\s+/).filter(Boolean);

    if (!trimmed) {
      return "Name is required.";
    }

    if (parts.length < 2) {
      return "Please enter your first and last name.";
    }

    if (parts.some((part) => part.length < 2)) {
      return "Each part of the name should have at least 2 characters.";
    }

    return "";
  };

  const validateEmail = (email: string) => {
    const trimmed = email.trim();

    if (!trimmed) {
      return "Email is required.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(trimmed)) {
      return "Please enter a valid email address.";
    }

    return "";
  };

  const validateMessage = (message: string) => {
    const trimmed = message.trim();

    if (!trimmed) {
      return "Message is required.";
    }

    if (trimmed.length < MIN_MESSAGE_LENGTH) {
      return `Message must be at least ${MIN_MESSAGE_LENGTH} characters.`;
    }

    return "";
  };

  const validateForm = () => {
    const newErrors: FormErrors = {
      name: validateName(formData.name),
      email: validateEmail(formData.email),
      message: validateMessage(formData.message),
    };

    Object.keys(newErrors).forEach((key) => {
      const typedKey = key as keyof FormErrors;
      if (!newErrors[typedKey]) {
        delete newErrors[typedKey];
      }
    });

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: undefined,
      submit: undefined,
    }));

    setSubmitStatus("idle");
  };

  const resetCaptcha = () => {
    if (recaptchaRef.current) {
      recaptchaRef.current.reset();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus("idle");

    const isValid = validateForm();

    if (!isValid) {
      return;
    }

    if (!EMAILJS_PUBLIC_KEY) {
      setSubmitStatus("error");
      setErrors({
        submit: "Email service is not configured. Please set VITE_EMAILJS_PUBLIC_KEY.",
      });
      return;
    }

    if (!RECAPTCHA_SITE_KEY) {
      setSubmitStatus("error");
      setErrors({
        submit: "reCAPTCHA is not configured. Please set VITE_RECAPTCHA_SITE_KEY.",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const token = await recaptchaRef.current?.executeAsync();

      if (!token) {
        setSubmitStatus("error");
        setErrors({
          submit: "reCAPTCHA verification failed. Please try again.",
        });
        return;
      }

      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          name: formData.name.trim(),
          email: formData.email.trim(),
          message: formData.message.trim(),
          "g-recaptcha-response": token,
        },
        {
          publicKey: EMAILJS_PUBLIC_KEY,
        }
      );

      setSubmitStatus("success");
      setFormData({
        name: "",
        email: "",
        message: "",
      });
      setErrors({});
      resetCaptcha();
    } catch (error) {
      setSubmitStatus("error");
      setErrors({
        submit: "Something went wrong while sending your message. Please try again.",
      });
      resetCaptcha();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar showBack backTo="/" showProfile={false} />

      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full space-y-5">
        <motion.div {...fadeUp(0)}>
          <h2 className="text-xl font-bold text-foreground">Contact Us</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Have a question or need help? Send us a message and we will get back to you.
          </p>
        </motion.div>

        <motion.div {...fadeUp(0.05)} className="card-civic">
          {submitStatus === "success" && (
            <div className="mb-6 rounded-lg border border-green-200 bg-accent/10 px-4 py-3 text-sm text-accent">
              Your message was sent successfully.
            </div>
          )}

          {(submitStatus === "error" || errors.submit) && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {errors.submit || "Something went wrong. Please try again."}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-foreground">
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Enter your first and last name"
                value={formData.name}
                onChange={handleChange}
                className={`input-civic ${
                  errors.name ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""
                }`}
              />
              {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-foreground">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={handleChange}
                className={`input-civic ${
                  errors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""
                }`}
              />
              {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="message" className="mb-2 block text-sm font-medium text-foreground">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={6}
                placeholder="Write your message here"
                value={formData.message}
                onChange={handleChange}
                className={`input-civic resize-none ${
                  errors.message ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""
                }`}
              />
              <div className="mt-2 flex items-center justify-between">
                {errors.message ? (
                  <p className="text-sm text-red-600">{errors.message}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Minimum {MIN_MESSAGE_LENGTH} characters.
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {formData.message.trim().length} characters
                </p>
              </div>
            </div>

            {RECAPTCHA_SITE_KEY ? (
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={RECAPTCHA_SITE_KEY}
                size="invisible"
              />
            ) : (
              <p className="text-sm text-red-600">
                reCAPTCHA is not configured. Please set VITE_RECAPTCHA_SITE_KEY.
              </p>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Sending..." : "Send message"}
              </button>
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );
};

export default ContactPage;