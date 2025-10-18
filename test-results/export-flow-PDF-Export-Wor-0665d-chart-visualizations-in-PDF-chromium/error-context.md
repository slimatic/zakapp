# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e5]:
    - generic [ref=e6]:
      - generic [ref=e8]: Z
      - heading "Welcome back" [level=2] [ref=e9]
      - paragraph [ref=e10]: Sign in to your ZakApp account
    - generic [ref=e11]:
      - generic [ref=e12]:
        - generic [ref=e13]:
          - generic [ref=e14]: Email address
          - textbox "Email address" [ref=e15]: test@example.com
        - generic [ref=e16]:
          - generic [ref=e17]: Password
          - textbox "Password" [ref=e18]: testpassword123
      - generic [ref=e20]:
        - img [ref=e22]
        - heading "Failed to fetch" [level=3] [ref=e25]
      - button "Sign in" [ref=e26] [cursor=pointer]
      - generic [ref=e27]:
        - paragraph [ref=e28]:
          - link "Forgot your password?" [ref=e29] [cursor=pointer]:
            - /url: /forgot-password
        - paragraph [ref=e30]:
          - text: Don't have an account?
          - link "Create one now" [ref=e31] [cursor=pointer]:
            - /url: /register
  - generic [ref=e32]:
    - img [ref=e34]
    - button "Open Tanstack query devtools" [ref=e82] [cursor=pointer]:
      - img [ref=e83] [cursor=pointer]
```