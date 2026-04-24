import { useRef, useState } from "react";
import { motion } from "framer-motion";
import emailjs from "@emailjs/browser";
import ReCAPTCHA from "react-google-recaptcha";
import CitizenLayout from "@/components/layout/CitizenLayout";

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

const MIN_MESSAGE_LENGTH = 30;
const EMAILJS_SERVICE_ID = "service_u0wnwlc";
const EMAILJS_TEMPLATE_ID = "template_sdwe1a3";
// EmailJS and reCAPTCHA keys come from env so secrets stay out of source code.
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

    if (!trimmed) return "Name is required.";
    if (parts.length < 2) return "Please enter your first and last name.";
    if (parts.some((part) => part.length < 2)) {
      return "Each part of the name should have at least 2 characters.";
    }

    return "";
  };

  const validateEmail = (email: string) => {
    const trimmed = email.trim();

    if (!trimmed) return "Email is required.";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) return "Please enter a valid email address.";

    return "";
  };

  const validateMessage = (message: string) => {
    const trimmed = message.trim();

    if (!trimmed) return "Message is required.";
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
      // Removes empty entries so only real validation errors stay in state.
      if (!newErrors[typedKey]) delete newErrors[typedKey];
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
    recaptchaRef.current?.reset();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus("idle");

    if (!validateForm()) return;

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

      // Gets an invisible reCAPTCHA token before sending to EmailJS.
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
          // Passes the captcha token so EmailJS can verify human submission.
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
    } catch {
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
    <CitizenLayout width="default" showBack backTo="/">
      <div className="contact-page">
        <motion.div {...fadeUp(0)} className="contact-page__header">
          <h2 className="page-title contact-page__title">Contact Us</h2>
          <p className="page-subtitle">
            Have a question or need help? Send us a message and we will get back to you.
          </p>
        </motion.div>

        <motion.div {...fadeUp(0.05)} className="card-base card-body">
          {submitStatus === "success" && (
            <div className="contact-page__banner contact-page__banner--success">
              Your message was sent successfully.
            </div>
          )}

          {(submitStatus === "error" || errors.submit) && (
            <div className="contact-page__banner contact-page__banner--error">
              {errors.submit || "Something went wrong. Please try again."}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="form-stack">
            <div className="field-stack">
              <label htmlFor="name" className="label-text contact-page__label">
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Enter your first and last name"
                value={formData.name}
                onChange={handleChange}
                className={`app-input ${errors.name ? "contact-page__input--error" : ""}`}
              />
              {errors.name && <p className="contact-page__error">{errors.name}</p>}
            </div>

            <div className="field-stack">
              <label htmlFor="email" className="label-text contact-page__label">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={handleChange}
                className={`app-input ${errors.email ? "contact-page__input--error" : ""}`}
              />
              {errors.email && <p className="contact-page__error">{errors.email}</p>}
            </div>

            <div className="field-stack">
              <label htmlFor="message" className="label-text contact-page__label">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={6}
                placeholder="Write your message here"
                value={formData.message}
                onChange={handleChange}
                className={`app-input contact-page__textarea ${
                  errors.message ? "contact-page__input--error" : ""
                }`}
              />
              <div className="contact-page__meta-row">
                {errors.message ? (
                  <p className="contact-page__error">{errors.message}</p>
                ) : (
                  <p className="contact-page__helper">
                    Minimum {MIN_MESSAGE_LENGTH} characters.
                  </p>
                )}
                <p className="contact-page__count">
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
              <p className="contact-page__error">
                reCAPTCHA is not configured. Please set VITE_RECAPTCHA_SITE_KEY.
              </p>
            )}

            <div className="contact-page__actions">
              <button
                type="submit"
                disabled={isSubmitting}
                className="app-btn app-btn--primary contact-page__submit"
              >
                {isSubmitting ? "Sending..." : "Send message"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </CitizenLayout>
  );
};

export default ContactPage;
