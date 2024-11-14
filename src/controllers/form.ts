import { Request, Response } from 'express';
import { Op } from 'sequelize';

import { FormType } from '../../models/FormType';
import { Form } from '../../models/Form';
import { User } from '../../models/User';
import { Company } from '../../models/Company';
import { sequelize } from '../db';
import { logAction } from '../middleware/log';
import { UserAction } from '../../models/UserAction';
import { Project } from '../../models/Project';

export const approveForm = async (req: Request, res: Response) => {
  const form_id = req.params.form_id;
  const product_quantity = Number(req.body.product_quantity) || 0;

  try {
    if (form_id) {
      const [numOfAffectedRows, updatedForms] = await Form.update(
        { status: 'approved' },
        { where: { form_id }, returning: true }
      )

      if (numOfAffectedRows > 0) {
        const updatedForm = updatedForms[0]; // Access the first updated record
        let additionalPoint = 0;

        const user = await User.findByPk(updatedForm.user_id);
        const company = await Company.findByPk(user?.company_id);
        const formType = await FormType.findByPk(updatedForm.form_type_id);
        const formsCount = await Form.count(
          {
            where: {
              user_id: user?.user_id,
              project_id: updatedForm.project_id,
              status: 'approved'
            },
          }
        )
        
        if (updatedForm.form_type_id === 1) {
          if (product_quantity >= 1 && product_quantity <= 50) {
            additionalPoint = 10
          } else if (product_quantity > 50 && product_quantity <= 300) {
            additionalPoint = 20
          } else if (product_quantity > 300) {
            additionalPoint = 40
          }
        } else if (updatedForm.form_type_id === 4) {
          if (product_quantity >= 1 && product_quantity <= 50) {
            additionalPoint = 20
          } else if (product_quantity > 50 && product_quantity <= 300) {
            additionalPoint = 50
          } else if (product_quantity > 300) {
            additionalPoint = 100
          }
        } else if (updatedForm.form_type_id === 5) {
          if (product_quantity >= 1 && product_quantity <= 50) {
            additionalPoint = 50
          } else if (product_quantity > 50 && product_quantity <= 300) {
            additionalPoint = 100
          } else if (product_quantity > 300) {
            additionalPoint = 200
          }
        } else if (updatedForm.form_type_id === 6) {
          if (product_quantity >= 1 && product_quantity <= 50) {
            additionalPoint = 100
          } else if (product_quantity > 50 && product_quantity <= 300) {
            additionalPoint = 200
          } else if (product_quantity > 300) {
            additionalPoint = 400
          }
        } else if (updatedForm.form_type_id === 7) {
          if (product_quantity >= 1 && product_quantity <= 50) {
            additionalPoint = 5
          } else if (product_quantity > 50 && product_quantity <= 300) {
            additionalPoint = 10
          } else if (product_quantity > 300) {
            additionalPoint = 20
          }
        } else if (updatedForm.form_type_id === 8) {
          if (product_quantity >= 1 && product_quantity <= 50) {
            additionalPoint = 10
          } else if (product_quantity > 50 && product_quantity <= 300) {
            additionalPoint = 25
          } else if (product_quantity > 300) {
            additionalPoint = 50
          }
        } else if (updatedForm.form_type_id === 9) {
          if (product_quantity >= 1 && product_quantity <= 50) {
            additionalPoint = 25
          } else if (product_quantity > 50 && product_quantity <= 300) {
            additionalPoint = 50
          } else if (product_quantity > 300) {
            additionalPoint = 100
          }
        } else if (updatedForm.form_type_id === 10) {
          if (product_quantity >= 1 && product_quantity <= 50) {
            additionalPoint = 50
          } else if (product_quantity > 50 && product_quantity <= 300) {
            additionalPoint = 100
          } else if (product_quantity > 300) {
            additionalPoint = 200
          }
        }

        if (user?.user_type === 'T2') {
          if (formsCount === 5) {
            additionalPoint += 200
          }
        } else if (user?.user_type === 'T1') {
          if (formsCount === 3) {
            additionalPoint += 200
          }
        }

        if (user && formType) {
          user.total_points = (user.total_points || 0) + formType.point_reward + additionalPoint; // Assuming `points` field exists on User
          user.accomplishment_total_points = (user.accomplishment_total_points || 0) + formType.point_reward + additionalPoint;
          await user.save();
        }
    
        if (company && formType) {
          company.total_points = (company.total_points || 0) + formType.point_reward + additionalPoint; // Assuming `points` field exists on User
          await company.save();
        }
    
        // await logAction(userId, req.method, 1, 'FORM', req.ip, req.get('User-Agent'));
    
        await UserAction.create({
          user_id: user!.user_id,
          entity_type: 'FORM',
          action_type: req.method,
          form_id: Number(form_id),
          // ip_address: req.ip,
          // user_agent: req.get('User-Agent'),
        });

      } else {
        res.status(400).json({ message: 'No record found with the specified form_id.', status: res.status });
      }
      
      res.status(200).json({ message: 'Form approved', status: res.status });
    } else {
      res.status(400).json({ message: 'Form failed to approve', status: res.status });
    }
  } catch (error: any) {
    console.error('Error creating form type:', error);

    // Handle validation errors from Sequelize
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map((err: any) => err.message);
      return res.status(400).json({ message: 'Validation error', errors: messages });
    }

    // Handle other types of errors
    res.status(500).json({ message: 'Something went wrong', error });
  }
};

export const deleteForm = async (req: Request, res: Response) => {
  const form_id = req.params.form_id;
  const product_quantity = Number(req.query.product_quantity) || 0;
  const poc_done = req.query.poc_done || false;

  try {
    if (form_id) {
      const [numOfAffectedRows, updatedForms] = await Form.update(
        { status: 'rejected' },
        { where: { form_id }, returning: true }
      )

      if (numOfAffectedRows > 0) {
        const updatedForm = updatedForms[0]; // Access the first updated record
        let removedPoint = 0;

        const user = await User.findByPk(updatedForm.user_id);
        const company = await Company.findByPk(user?.company_id);
        const formType = await FormType.findByPk(updatedForm.form_type_id);
        const formsCount = await Form.count(
          {
            where: {
              user_id: user?.user_id,
              project_id: updatedForm.project_id,
              status: 'approved'
            },
          }
        )
        
        if (updatedForm.form_type_id === 1) {
          if (product_quantity >= 1 && product_quantity <= 50) {
            removedPoint = 10
          } else if (product_quantity > 50 && product_quantity <= 300) {
            removedPoint = 20
          } else if (product_quantity > 300) {
            removedPoint = 40
          }
        } else if (updatedForm.form_type_id === 4) {
          if (product_quantity >= 1 && product_quantity <= 50) {
            removedPoint = 20
          } else if (product_quantity > 50 && product_quantity <= 300) {
            removedPoint = 50
          } else if (product_quantity > 300) {
            removedPoint = 100
          }
        } else if (updatedForm.form_type_id === 5) {
          if (product_quantity >= 1 && product_quantity <= 50) {
            removedPoint = 50
          } else if (product_quantity > 50 && product_quantity <= 300) {
            removedPoint = 100
          } else if (product_quantity > 300) {
            removedPoint = 200
          }
        } else if (updatedForm.form_type_id === 6) {
          if (product_quantity >= 1 && product_quantity <= 50) {
            removedPoint = 100
          } else if (product_quantity > 50 && product_quantity <= 300) {
            removedPoint = 200
          } else if (product_quantity > 300) {
            removedPoint = 400
          }
        } else if (updatedForm.form_type_id === 7) {
          if (product_quantity >= 1 && product_quantity <= 50) {
            removedPoint = 5
          } else if (product_quantity > 50 && product_quantity <= 300) {
            removedPoint = 10
          } else if (product_quantity > 300) {
            removedPoint = 20
          }
        } else if (updatedForm.form_type_id === 8) {
          if (product_quantity >= 1 && product_quantity <= 50) {
            removedPoint = 10
          } else if (product_quantity > 50 && product_quantity <= 300) {
            removedPoint = 25
          } else if (product_quantity > 300) {
            removedPoint = 50
          }
        } else if (updatedForm.form_type_id === 9) {
          if (product_quantity >= 1 && product_quantity <= 50) {
            removedPoint = 25
          } else if (product_quantity > 50 && product_quantity <= 300) {
            removedPoint = 50
          } else if (product_quantity > 300) {
            removedPoint = 100
          }
        } else if (updatedForm.form_type_id === 10) {
          if (product_quantity >= 1 && product_quantity <= 50) {
            removedPoint = 50
          } else if (product_quantity > 50 && product_quantity <= 300) {
            removedPoint = 100
          } else if (product_quantity > 300) {
            removedPoint = 200
          }
        }

        if (user?.user_type === 'T2') {
          if (formsCount === 5) {
            removedPoint -= 200
          }
        } else if (user?.user_type === 'T1') {
          if (formsCount === 3) {
            removedPoint -= 200
          }
        }

        if (user && formType) {
          let point_reward = formType.point_reward;

          if (formType.form_type_id === 3) {
            point_reward = poc_done ? point_reward : point_reward / 2
          }

          user.total_points = (user.total_points || 0) - point_reward - removedPoint; // Assuming `points` field exists on User
          user.accomplishment_total_points = (user.accomplishment_total_points || 0) - formType.point_reward - removedPoint;
          await user.save();
        }
    
        if (company && formType) {
          let point_reward = formType.point_reward;

          if (formType.form_type_id === 3) {
            point_reward = poc_done ? point_reward : point_reward / 2
          }
          company.total_points = (company.total_points || 0) - point_reward - removedPoint; // Assuming `points` field exists on User
          await company.save();
        }
    
        // await logAction(userId, req.method, 1, 'FORM', req.ip, req.get('User-Agent'));
    
        await UserAction.create({
          user_id: user!.user_id,
          entity_type: 'FORM',
          action_type: req.method,
          form_id: Number(form_id),
          // ip_address: req.ip,
          // user_agent: req.get('User-Agent'),
        });

      } else {
        res.status(400).json({ message: 'No record found with the specified form_id.', status: res.status });
      }
      
      res.status(200).json({ message: 'Form deleted', status: res.status });
    } else {
      res.status(400).json({ message: 'Form failed to delete', status: res.status });
    }
  } catch (error: any) {
    console.error('Error creating form type:', error);

    // Handle validation errors from Sequelize
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map((err: any) => err.message);
      return res.status(400).json({ message: 'Validation error', errors: messages });
    }

    // Handle other types of errors
    res.status(500).json({ message: 'Something went wrong', error });
  }
};

export const createFormType = async (req: Request, res: Response) => {
  const { form_name, point_reward } = req.body;

  try {
    const formType = await FormType.create({
      form_name,
      point_reward
    })

    res.status(200).json({ message: `${form_name} created`, status: res.status });
  } catch (error: any) {
    console.error('Error creating form type:', error);

    // Handle validation errors from Sequelize
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map((err: any) => err.message);
      return res.status(400).json({ message: 'Validation error', errors: messages });
    }

    // Handle other types of errors
    res.status(500).json({ message: 'Something went wrong', error });
  }
};

export const formSubmission = async (req: any, res: Response) => {
  const { form_type_id, form_data, project_id, product_quantity = 0, pic_done = false } = req.body;

  const transaction = await sequelize.transaction();

  const userId = req.user?.userId;
  const companyId = req.user?.companyId;
  let isProjectFormCompleted = false;
  
  try {
    const submission = await Form.create({
      user_id: userId,
      form_type_id,
      form_data,
      project_id,
      status: Number(form_type_id) === 6 ? 'submitted' : 'approved'
    })

    // Update user points based on the form submission
    const company = await Company.findByPk(companyId, { transaction });
    const user = await User.findByPk(userId, { transaction });
    const formType = await FormType.findByPk(form_type_id, { transaction });
    const formsCount = await Form.count(
      {
        where: {
          user_id: userId,
          project_id: project_id,
          status: 'approved'
        },
        transaction
      }
    )

    let additionalPoint = 0;

    if (formType) {
      if (formType.form_type_id === 1) {
        if (product_quantity >= 1 && product_quantity <= 50) {
          additionalPoint = 10
        } else if (product_quantity > 50 && product_quantity <= 300) {
          additionalPoint = 20
        } else if (product_quantity > 300) {
          additionalPoint = 40
        }
      } else if (formType.form_type_id === 4) {
        if (product_quantity >= 1 && product_quantity <= 50) {
          additionalPoint = 20
        } else if (product_quantity > 50 && product_quantity <= 300) {
          additionalPoint = 50
        } else if (product_quantity > 300) {
          additionalPoint = 100
        }
      } else if (formType.form_type_id === 5) {
        if (product_quantity >= 1 && product_quantity <= 50) {
          additionalPoint = 50
        } else if (product_quantity > 50 && product_quantity <= 300) {
          additionalPoint = 100
        } else if (product_quantity > 300) {
          additionalPoint = 200
        }
      }
      // else if (formType.form_type_id === 6) {
      //   if (product_quantity >= 1 && product_quantity <= 50) {
      //     additionalPoint = 100
      //   } else if (product_quantity > 50 && product_quantity <= 300) {
      //     additionalPoint = 200
      //   } else if (product_quantity > 300) {
      //     additionalPoint = 400
      //   }
      // }
      else if (formType.form_type_id === 7) {
        if (product_quantity >= 1 && product_quantity <= 50) {
          additionalPoint = 5
        } else if (product_quantity > 50 && product_quantity <= 300) {
          additionalPoint = 10
        } else if (product_quantity > 300) {
          additionalPoint = 20
        }
      } else if (formType.form_type_id === 8) {
        if (product_quantity >= 1 && product_quantity <= 50) {
          additionalPoint = 10
        } else if (product_quantity > 50 && product_quantity <= 300) {
          additionalPoint = 25
        } else if (product_quantity > 300) {
          additionalPoint = 50
        }
      } else if (formType.form_type_id === 9) {
        if (product_quantity >= 1 && product_quantity <= 50) {
          additionalPoint = 25
        } else if (product_quantity > 50 && product_quantity <= 300) {
          additionalPoint = 50
        } else if (product_quantity > 300) {
          additionalPoint = 100
        }
      } else if (formType.form_type_id === 10) {
        if (product_quantity >= 1 && product_quantity <= 50) {
          additionalPoint = 50
        } else if (product_quantity > 50 && product_quantity <= 300) {
          additionalPoint = 100
        } else if (product_quantity > 300) {
          additionalPoint = 200
        }
      }
    }

    if (formType) {
      if (formType.form_type_id !== 6) {
        if (user?.user_type === 'T2') {
          if (formsCount === 6) {
            additionalPoint += 200
            isProjectFormCompleted = true;
          }
        } else if (user?.user_type === 'T1') {
          if (formsCount === 4) {
            additionalPoint += 200
            isProjectFormCompleted = true;
          }
        }
      }
    }

    if (user && formType && formType?.form_type_id !== 6) {
      let point_reward = formType.point_reward;

      if (formType.form_type_id === 3) {
        point_reward = pic_done ? point_reward : point_reward / 2
      }

      user.total_points = (user.total_points || 0) + point_reward + additionalPoint; // Assuming `points` field exists on User
      user.accomplishment_total_points = (user.accomplishment_total_points || 0) + formType.point_reward + additionalPoint;
      await user.save({ transaction });
    }

    if (company && formType && formType?.form_type_id !== 6) {
      let point_reward = formType.point_reward;

      if (formType.form_type_id === 3) {
        point_reward = pic_done ? point_reward : point_reward / 2
      }
      company.total_points = (company.total_points || 0) + point_reward + additionalPoint; // Assuming `points` field exists on User
      await company.save({ transaction });
    }

    // await logAction(userId, req.method, 1, 'FORM', req.ip, req.get('User-Agent'));

    await UserAction.create({
      user_id: userId,
      entity_type: 'FORM',
      action_type: formType?.form_type_id === 6 ? 'SUBMITTED' : req.method,
      form_id: submission.form_id,
      // ip_address: req.ip,
      // user_agent: req.get('User-Agent'),
    });

    await transaction.commit();

    res.status(200).json({ message: `Form successfully submitted`, status: res.status, data: { form_completed: isProjectFormCompleted } });
  } catch (error: any) {
    await transaction.rollback();
    console.error('Error creating form:', error);

    // Handle validation errors from Sequelize
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map((err: any) => err.message);
      return res.status(400).json({ message: 'Validation error', errors: messages });
    }

    // Handle other types of errors
    res.status(500).json({ message: 'Something went wrong', error });
  }
};

export const getFormByProject = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;
    const projectId = req.query.projectId;

    const forms = await Form.findAll(
      {
        where: {
          user_id: userId,
          project_id: projectId,
          status: {
            [Op.or]: ['approved', 'submitted']
          }
        }
      }
    )

    res.status(200).json({ message: 'List of forms', status: res.status, data: forms });
  } catch (error: any) {
    console.error('Error fetching forms:', error);

    // Handle validation errors from Sequelize
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map((err: any) => err.message);
      return res.status(400).json({ message: 'Validation error', errors: messages });
    }

    // Handle other types of errors
    res.status(500).json({ message: 'Something went wrong', error });
  }
}